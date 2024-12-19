import { createHash } from 'crypto';
import { ERROR_CODE, IS_NEGATIVE, RAW_GALLERY_KEYS } from './constant';
import { IdSet, JsonObject, Node, PopularityPeriod, Tag } from './type';
import { Gallery } from './type';
import { getNozomiUri } from './uri';
import { HitomiError, binarySearch, fetch, getIdSet, getNodeAtAddress } from './utility';

export function getGallery(id: number): Promise<Gallery> {
	return fetch('ltn.hitomi.la/galleries/' + id + '.js')
	.then(function (response: Buffer): Gallery {
		// Sequence of keys varies among galleries
		const responseJson: JsonObject = JSON.parse(response.toString('utf-8').slice(18));
		// Reference https://v8.dev/blog/cost-of-javascript-2019#json
		const gallery: Gallery = JSON.parse('{"id":' + id + ',"title":{"display":"' + (responseJson['title'] as string).replace(/"/g, '\\"') + '","japanese":' + (typeof(responseJson['japanese_title']) === 'string' ? '"' + responseJson['japanese_title'].replace(/"/g, '\\"') + '"' : 'null') + '},"type":"' + responseJson['type'] + '","languageName":{"english":' + (typeof(responseJson['language']) !== null ? '"' + responseJson['language'] + '"' : 'null') + ',"local":' + (typeof(responseJson['language_localname']) !== null ? '"' + responseJson['language_localname'] + '"' : 'null') + '},"artists":[],"groups":[],"series":[],"characters":[],"tags":[],"files":[],"publishedDate":null,"translations":[],"relatedIds":null}');

		for(let i: number = 0; i < RAW_GALLERY_KEYS['length']; i++) {
			const pluralType: string = RAW_GALLERY_KEYS[i] + 's';

			if(responseJson[pluralType] !== null) {
				for(let j: number = 0; j < (responseJson[pluralType] as string[])['length']; j++) {
					(gallery[(!pluralType.startsWith('p') ? pluralType : 'series') as keyof Gallery] as string[]).push((responseJson[pluralType] as JsonObject[])[j][RAW_GALLERY_KEYS[i]] as string);
				}
			}
		}

		if(Array.isArray(responseJson['tags'])) {
			for(let i: number = 0; i < responseJson['tags']['length']; i++) {
				let type: Tag['type'] = 'tag';

				if(Number.parseInt(responseJson['tags'][i]['male']) === 1) {
					type = 'male';
				} else if(Number.parseInt(responseJson['tags'][i]['female']) === 1) {
					type = 'female';
				}

				gallery['tags'].push({
					type: type,
					name: responseJson['tags'][i]['tag']
				});
			}
		}

		for(let i: number = 0; i < (responseJson['files'] as JsonObject[])['length']; i++) {
			gallery['files'].push({
				index: i,
				hash: (responseJson['files'] as JsonObject[])[i]['hash'] as Gallery['files'][number]['hash'],
				name: (responseJson['files'] as JsonObject[])[i]['name'] as Gallery['files'][number]['name'],
				hasAvif: Boolean((responseJson['files'] as JsonObject[])[i]['hasavif']),
				hasWebp: Boolean((responseJson['files'] as JsonObject[])[i]['haswebp']),
				hasJxl: Boolean((responseJson['files'] as JsonObject[])[i]['hasjxl']),
				width: (responseJson['files'] as JsonObject[])[i]['width'] as Gallery['files'][number]['width'],
				height: (responseJson['files'] as JsonObject[])[i]['height'] as Gallery['files'][number]['height']
			});
		}

		gallery['publishedDate'] = new Date(responseJson['date'] as string);

		for(let i: number = 0; i < (responseJson['languages'] as JsonObject[])['length']; i++) {
			gallery['translations'].push({
				id: Number((responseJson['languages'] as JsonObject[])[i]['galleryid']),
				languageName: {
					english: (responseJson['languages'] as JsonObject[])[i]['name'] as Gallery['languageName']['english'],
					local: (responseJson['languages'] as JsonObject[])[i]['language_localname'] as Gallery['languageName']['local']
				}
			});
		}

		gallery['relatedIds'] = responseJson['related'] as Gallery['relatedIds'];

		return gallery;
	});
}

export function getGalleryIds(options: {
	title?: string;
	tags?: Tag[];
	range?: {
		start?: number;
		end?: number;
	};
	popularityOrderBy?: PopularityPeriod;
} = {}): Promise<number[]> {
	return fetch('ltn.hitomi.la/galleriesindex/version')
	.then(function (response: Buffer): Promise<number[]> {
		const isOptionsTitleAvailable: boolean = typeof(options['title']) === 'string';
		const isOptionsTagsAvailable: boolean = Array.isArray(options['tags']) && options['tags']['length'] !== 0;
		const isOptionsRangeAvailable: boolean = typeof(options['range']) === 'object';
		const shouldSliceResult: boolean = isOptionsRangeAvailable && (isOptionsTitleAvailable || isOptionsTagsAvailable);
		const version: string = response.toString('utf-8');
		const idSetPromises: Promise<IdSet>[] = [];
	
		// @ts-expect-error | Already checked
		if((typeof(options['popularityOrderBy']) === 'string' || isOptionsRangeAvailable || isOptionsTagsAvailable && options['tags'][0]['isNegative'])) {
			idSetPromises.push(fetch(getNozomiUri({
				popularityOrderBy: options['popularityOrderBy']
			}), !shouldSliceResult ? {
				// @ts-expect-error | Already checked
				range: 'bytes=' + (typeof(options['range']['start']) === 'number' ? options['range']['start'] * 4 : '0') + '-' + (typeof(options['range']['end']) === 'number' ? options['range']['end'] * 4 - 1 : '')
			} : undefined).then(getIdSet));
		}
	
		if(isOptionsTitleAvailable) {
			// @ts-expect-error | Already checked
			options['title'] = options['title'].toLocaleLowerCase() + ' ';
	
			let currentIndex: number = 0;
			let nextIndex: number = options['title'].indexOf(' ');
			
			while(nextIndex !== -1) {
				if(nextIndex - currentIndex !== 0) {
					const key: Buffer = createHash('sha256').update(options['title'].slice(currentIndex, nextIndex)).digest().subarray(0, 4);
	
					idSetPromises.push(getNodeAtAddress(0n, version)
					.then(function (node?: Node): Promise<[bigint, number] | undefined> | undefined {
						if(typeof(node) === 'object') {
							return binarySearch(key, node, version);
						} else {
							return;
						}
					})
					.then(function (data?: [bigint, number]): Promise<Buffer | undefined> | undefined {
						if(Array.isArray(data)) {
							return fetch('ltn.hitomi.la/galleriesindex/galleries.' + version + '.data', {
								range: 'bytes=' + (data[0] + 4n) + '-' + (data[0] + BigInt(data[1]) - 1n)
							});
						} else {
							return;
						}
					})
					.then(function (response?: Buffer): IdSet {
						return getIdSet(typeof(response) === 'object' ? response : Buffer.from([]));
					}));
				} else {
					return Promise.reject(new HitomiError(ERROR_CODE['INVALID_VALUE'], 'options[\'title\']', 'not contain continuous or edge space'));
				}
	
				currentIndex = nextIndex + 1;
				nextIndex = options['title'].indexOf(' ', currentIndex);
			}
		}
	
		if(isOptionsTagsAvailable) {
			// @ts-expect-error | Already checked
			for(let i: number = 0; i < options['tags']['length']; i++) {
				idSetPromises.push(fetch(getNozomiUri({
					// @ts-expect-error | Already checked
					tag: options['tags'][i]
				})).then(function (response: Buffer): IdSet {
					// @ts-expect-error | Already checked
					return getIdSet(response, options['tags'][i]['isNegative']);
				}));
			}
		}
	
		return idSetPromises.reduce(function (previousIdSetPromise: Promise<IdSet>, idSetPromise: Promise<IdSet>): Promise<IdSet> {
			return previousIdSetPromise.then(function (previousIdSet: IdSet): Promise<IdSet> {
				return idSetPromise.then(function (idSet: IdSet): IdSet {
					for(const id of previousIdSet) {
						if(idSet[IS_NEGATIVE] === idSet.has(id)/* ~(idSet[IS_NEGATIVE] ^ idSet.has(id)) */) {
							previousIdSet.delete(id);
						}
					}
		
					return previousIdSet;
				});
			});
		}, fetch(getNozomiUri()).then(getIdSet))
		.then(function (idSet: IdSet): number[] {
			const ids: number[] = Array.from(idSet);
	
			// @ts-expect-error | Already checked
			return shouldSliceResult ? ids.slice(options['range']['start'], options['range']['end']) : ids;
		});
	});
}