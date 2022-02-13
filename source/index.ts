import { IncomingMessage } from 'http';
import { request, Agent, AgentOptions } from 'https';
import { connect, TLSSocket } from 'tls';

module hitomi {
	// type definition

	export interface Image {
		index: number;
		hash: string;
		extension: 'jpg' | 'png' | 'gif';
		hasAvif: boolean;
		hasWebp: boolean;
		width: number;
		height: number;
	}

	export interface Tag {
		type: 'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag';
		name: string;
		isNegative?: boolean;
	}

	export interface Gallery {
		id: number;
		title: {
			display: string;
			japanese: string | null;
		};
		type: 'doujinshi' | 'manga' | 'artistcg' | 'gamecg' | 'anime';
		languageName: {
			english: string | null;
			local: string | null;
		};
		artists: string[];
		groups: string[];
		series: string[];
		characters: string[];
		tags: Tag[];
		files: Image[];
		publishedDate: Date;
		translations: Pick<Gallery, 'id' | 'languageName'>[];
		relatedIds: number[];
	}

	export type OrderCriteria = 'index' | 'popularity';

	export type StartingCharacter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | '0-9';

	interface LooseObject {
		[key: string]: any;
	}

	// Reference property b of gg variable in https://ltn.hitomi.la/gg.js
	const imagePathCode: string = '1644728402';

	// Reference property m of gg variable in https://ltn.hitomi.la/gg.js
	const imageSubdomainRegularExpression: RegExp = /^(0|1(0(0[025-69]|1[2-36-79]?|2[27-9]?|3[0-13-48-9]?|4[0-24-57-9]|5[0-13-48-9]?|6[02-49]|7[35-68-9]|8[3-46-8]|9[16]?)?|1(0[069]?|1[35]?|2[35]?|3[1-359]?|4[02]|5[0-14-58-9]?|6[0-1358]|7[08-9]?|8[14-57-9]?|9[24-68-9])|2(0[1-246]|1[0-359]?|2[0-58-9]?|3[058]?|4[1-358-9]|5[3579]?|6[24-57]?|7[0247]|8[1359]?|9[1-35-69]?)|3(0[19]|1[0-135-68-9]?|2[2-36]?|3[038-9]?|4[02-36-9]?|5[37-8]|6[1-2479]|7[136-79]|8[1-35]?|9[02-79])?|4(0[07-8]|1[139]|2[2-357]|3[0-15-8]?|4[258]?|5[0-158]|6[3-57]?|7[2-4]|8[27]?|9[05-68])|5(0[36-9]?|1[15-68-9]|2[0246]?|3[57]?|4[02-46]?|5[046]|6[0-47-8]|7[135-6]?|8[6-7]?|9[0-2479])|6(0[0-14]|1[0-58-9]?|2[0-13-468]?|3[3-68]|4[14-7]|5[13]?|6[048-9]|7[24-68]?|8[1-46]|9[25])?|7(0[1-246-79]?|1[0-29]|2[1-25-7]|3[0-26-79]|4[04-5]|5[2-6]|6[0-38-9]|7[1-35-7]?|8[268-9]?|9[0-1579]?)|8(0[024-58]?|1[048-9]|2[15-68-9]|3[04-79]|4[24-57]?|5[0358]|6[39]|7[0-135]?|8[2-47]?|9[0-136-8]?)|9(0[14]?|1[03-469]|2[0248]?|3[04-59]|4[359]|5[246]?|6[1-68]?|7[3-48]?|8[0-14-57-8]?|9[36-79]))?|2(0(0[469]|1[14-58-9]|2[0-49]?|3[135-79]?|4[0-158-9]|5[2-35-6]|6[1-268]?|7[0-8]|8[14-68-9]|9[03-7]?)|1(0[13-8]|1[03-69]|2[2-579]?|3[135-7]|4[0-24-57]|5[13-8]|6[0-135-69]?|7[2-8]?|8[2-57]|9[57-8]?)|2(0[24]|1[37-8]|2[0-379]?|3[02-3]?|4[0-13-69]?|5[13579]?|6[1-3]?|7[046-79]|8[579]?|9[0-13-46-8])|3(0[0-5]?|1[02-37-8]?|2[35-7]|3[39]?|4[0369]|5[35-7]|6[0469]|7[0-46]?|8[07]?|9[2-9])?|4(0[3-57]?|1[06-8]?|2[029]?|3[1-268]|4[24-69]?|5[0357-9]?|6[02-46-79]?|7[02-58-9]|8[0-257]|9[0-13-579]?)?|5(0[1-25-7]?|1[03-7]|2[0248-9]|3[0-37-9]|4[47-9]?|5[026-8]|6[1-257]?|7[048]?|8[059]|9[1-36])?|6(0[038]?|1[2468]?|2[2-47-8]|3[0-279]|4[1-25-7]|5[1-46-7]?|6[0-26-8]|7[2-47-9]|8[246]|9[268-9]?)|7(0[14-57]|1[3-48]|2[02-48-9]?|3[1-26-7]?|4[028-9]|5[0-137-9]?|6[13-9]?|7[0-368-9]?|8[0-27-9]|9[0-24-68])?|8(0[24-69]|1[0-359]|2[0-24-68-9]|3[0-168-9]|4[1-3579]|5[0-148-9]|6[024-68-9]?|7[1-579]|8[0-37-9]?|9[136-79]?)|9(0[0246-9]|1[037]|2[2-35-79]?|37?|4[1357-8]?|5[1-357-8]|6[0-1358]|7[02-35-6]|8[1-26]|9[2-39])?)?|3(0(0[057-9]?|1[1-58]?|2[38]|3[2-38-9]?|4[04-57-9]|5[0-2469]|6[158]?|7[0-35-68-9]|8[02-6]|9[024-7])|1(0[03-57-9]|1[0-38]|2[0-257-8]|3[024-79]|4[1-26-8]?|5[68-9]?|6[0-47]|7[079]?|8[258]?|9[14-79]?)?|2(0[2-468-9]|1[147-8]?|2[0-13-59]|3[1-26]?|4[0-24-6]?|5[0246-7]?|6[0-24-7]|7[02-57-8]|8[0-46-8]|9[1-68-9]?)?|3(0[08-9]?|1[046]?|2[057-8]?|3[02-38-9]|4[1-26-79]|5[1-36-7]?|6[3-58-9]|7[0-1369]?|8[02-58-9]|9[1-36]?)?|4(0[0-13-49]|1[1-24-57]?|2[14]?|3[2-35-8]?|4[0-24-79]|5[2-38-9]|6[1-46]|7[0-13-479]|8[13-47]?|9[68-9]?)?|5(0[1-25-6]?|1[1-35-9]?|2[13-47-9]?|3[68]?|4[0-24-8]|5[13-4]|6[02-469]?|7[2-47-8]|8[159]?|9[07]?)|6(0[257-9]?|1[02-58-9]|2[13-57-8]?|3[1-24-58]|4[179]|5[02-37-9]?|6[6-7]|7[0-14-7]|8[2-4]|9[25-6])|7(0[357-8]|1[0-18-9]?|2[1-59]|3[6-9]?|4[057-8]|5[1-38-9]?|6[037-9]|7[05-68-9]|8[1-38-9]|97)|8(0[0-149]|1[0-135]?|2[0-25-79]?|3[24-8]|4[04-58-9]|5[02-359]|6[0-13-49]?|7[136]|8[026-7]|9[357-9]?)|9(0[03]?|1[02-3579]|2[2479]?|3[024-7]?|4[0-14-57-8]?|5[249]?|6[13-46-8]?|7[135-68]|8[1-357-9]|9[13]))|4(0(0[047]|1[1-25-9]?|2[0-146]?|3[0-35-69]|4[0-24-69]|5[0357-9]?|6[26]?|7[0-1469]?|8[02-69]?|9[0-13]?)|1[13-579]?|2[037]|3[079]?|4[6-8]?|5[57-9]|6[1-35-68-9]?|7[0-146-9]|8[13-479]|9[24-58]?)?|5(0[0479]?|1[0247-8]?|2[2-48]|3[0-139]|4[024-9]|5[13-68-9]?|6[1-25-69]?|7[0-47-8]?|8[057-9]|9[47-9])|6(0[2-35-68]|1[3-8]|2[04-5]|3[36-79]?|4[146-8]|5[14-58]|6[1-57-9]|7[1-24-58-9]|8[2-48]|9[468])?|7(0[1-247-8]?|1[0-27-9]?|2[1-68-9]|3[0-579]?|4[135-7]?|5[1-47]|6[3-59]|7[1-39]?|8[138-9]|9[0-15-8])?|8(0[0-246-8]|1[0-479]?|2[02-35-68-9]?|3[0-14-57-9]|4[0-359]?|5[1357-8]|6[15-69]?|7[4-58]|8[0-479]|9[0-24-6])|9(0[246]|1[0-137-8]?|2[1-246-79]|3[1-379]|4[6-7]|5[3-48]?|60|7[0-24-57-9]|8[19]|9[1-26-9]?))$/;

	const galleryCommonTypes: readonly string[] = ['artist', 'group', 'parody', 'character'];

	// utility

	class HitomiError extends Error {
		private code: 'INVALID_VALUE' | 'DUPLICATED_ELEMENT' | 'LACK_OF_ELEMENT' | 'REQEUST_REJECTED';

		constructor(key: HitomiError['code'], argument: string) {
			super('Unknown');

			this['code'] = key;

			const quote: string = argument.includes('\'') ? '`' : '\'';

			argument = quote + argument + quote;

			switch(key) {
				case 'INVALID_VALUE': {
					this['message'] = 'Value of ' + argument + ' was not valid';

					break;
				}

				case 'DUPLICATED_ELEMENT': {
					this['message'] = 'Element of ' + argument + ' was duplicated';

					break;
				}

				case 'LACK_OF_ELEMENT': {
					this['message'] = 'Elements of ' + argument + ' was not enough';

					break;
				}

				case 'REQEUST_REJECTED': {
					this['message'] = 'Request to ' + argument + ' was rejected';

					break;
				}
			}
		}

		get name(): string {
			return 'HitomiError [' + this['code'] + ']';
		}
	}

	function isInteger(value: any): boolean {
		return Number.parseInt(value) === Number(value) && Number.isFinite(value) && typeof(value) !== 'object';
	}

	function get32BitIntegerNumbers(buffer: Buffer, options: { splitBy?: number } = {}): Set<number> {
		const splitCriteria: number = options['splitBy'] || 4;

		let arrayBuffer: ArrayBuffer = new ArrayBuffer(buffer['byteLength']);
		let unit8Array: Uint8Array = new Uint8Array(arrayBuffer);

		for (let i: number = 0; i < buffer['byteLength']; ++i) {
			unit8Array[i] = buffer[i];
		}

		const dataView: DataView = new DataView(arrayBuffer);
		const totalLength: number = dataView['byteLength'] / splitCriteria;

		let numbers: Set<number> = new Set<number>();

		for(let i: number = 0; i < totalLength; i++) {
			numbers.add(dataView.getInt32(i * splitCriteria, false));
		}

		return numbers;
	}

	const agent: Agent = (new class extends Agent {
		public createConnection(options: AgentOptions, callback?: () => void): TLSSocket {
			return connect(Object.assign(options, { 'servername': undefined }), callback);
		}
	});

	function fetchBuffer(url: string, header: LooseObject = {}): Promise<Buffer> {
		return new Promise<Buffer>(function (resolve: (value: Buffer) => void, reject: (reason?: any) => void): void {
			const _url: URL = new URL(url);

			request({
				hostname: _url['hostname'],
				path: _url['pathname'],
				method: 'GET',
				port: 443,
				headers: Object.assign(header, {
					'Accept': '*/*',
					'Connection': 'keep-alive',
					'Referer': 'https://hitomi.la'
				}),
				agent: agent
			}, function (response: IncomingMessage): void {
				let buffers: Buffer[] = [];
				let bufferLength: number = 0;

				switch(response['statusCode']) {
					case 200:
					case 206: {
						response.on('data', function (chunk: any): void {
							buffers.push(chunk);
							bufferLength += chunk['byteLength'];

							return;
						})
						.on('error', function (): void {
							reject(new HitomiError('REQEUST_REJECTED', url));

							return;
						})
						.on('end', function (): void {
							resolve(Buffer.concat(buffers, bufferLength));

							return;
						});

						break;
					}

					default: {
						reject(new HitomiError('REQEUST_REJECTED', url));

						break;
					}
				}

				return;
			}).on('error', function (): void {
				reject(new HitomiError('REQEUST_REJECTED', url));

				return;
			})
			.end();

			return;
		});
	}

	// url

	export function getNozomiUrl(tag: Tag, options: { orderBy?: OrderCriteria } = {}): string {
		if(tag['type'] !== 'language' || typeof(options['orderBy']) === 'undefined') {
			let area: string = '';
			let tagString: string = '';
			let language: string = 'all';

			switch(tag['type']) {
				case 'male':
				case 'female': {
					area = 'tag/';
					tagString = tag['type'] + ':' + tag['name'].replace(/_/g, ' ');

					break;
				}

				case 'language': {
					tagString = options['orderBy'] || 'index';
					language = tag['name'];

					break;
				}

				default: {
					area = tag['type'] + '/';
					tagString = tag['name'].replace(/_/g, ' ');

					break;
				}
			}

			return 'https://ltn.hitomi.la/n/' + area + tagString + '-' + language + '.nozomi';
		} else {
			throw new HitomiError('INVALID_VALUE', 'options[\'orderBy\']');
		}
	}

	export function getTagUrl(type: Tag['type'], options: { startWith?: StartingCharacter } = {}): string {
		if(type !== 'language' || typeof(options['startWith']) === 'undefined') {
			let url: string = 'https://hitomi.la/';

			switch(type) {
				case 'tag':
				case 'male':
				case 'female': {
					url += 'alltags-';

					break;
				}

				case 'artist': {
					url += 'allartists-';

					break;
				}

				case 'series': {
					url += 'allseries-';

					break;
				}

				case 'character': {
					url += 'allcharacters-';

					break;
				}

				case 'group': {
					url += 'allgroups-';

					break;
				}

				case 'language': {
					url = 'ltn.' + url + 'language_support.js';

					break;
				}

				default: {
					throw new HitomiError('INVALID_VALUE', 'extension');
				}
			}

			if(type !== 'language') {
				switch(type) {
					case 'male': {
						url += 'm';

						break;
					}

					case 'female': {
						url += 'f';

						break;
					}

					default: {
						if(options['startWith'] === '0-9') {
							url += '123';
						} else {
							url += options['startWith'];
						}

						break;
					}
				}

				return url + '.html';
			} else {
				return url;
			}
		} else {
			throw new HitomiError('INVALID_VALUE', 'options[\'startWith\']');
		}
	}

	export function getImageUrl(image: Image, extension: Image['extension'] | 'avif' | 'webp', options: { isThumbnail?: boolean; } = {}): string {
		const isThumbnail: boolean = options['isThumbnail'] || false;

		switch(extension) {
			case 'jpg': {
				if(image['extension'] !== 'jpg') {
					throw new HitomiError('INVALID_VALUE', 'extension');
				} else {
					break;
				}
			}

			case 'png':
			case 'gif': {
				if(isThumbnail || image['extension'] !== extension) {
					throw new HitomiError('INVALID_VALUE', 'extension');
				} else {
					break;
				}
			}

			case 'webp': {
				if(isThumbnail || !image['hasWebp']) {
					throw new HitomiError('INVALID_VALUE', 'extension');
				} else {
					break;
				}
			}

			case 'avif': {
				if(!image['hasAvif']) {
					throw new HitomiError('INVALID_VALUE', 'extension');
				} else {
					break;
				}
			}

			default: {
				throw new HitomiError('INVALID_VALUE', 'extension');
			}
		}

		if(/^[0-9a-f]{64}$/.test(image['hash'])) {
			if(isInteger(image['index']) && image['index'] >= 0) {
				let imagePath: string = '';
				let subdomain: string = '';
				let folderName: string = '';

				if(!isThumbnail) {
					const imageHashCode: string = String(Number.parseInt(image['hash'].slice(-1) + image['hash'].slice(-3, -1), 16));
					imagePath = imagePathCode + '/' + imageHashCode + '/' + image['hash'];

					// Reference subdomain_from_url function from https://ltn.hitomi.la/common.js
					subdomain = imageSubdomainRegularExpression.test(imageHashCode) ? 'a' : 'b';

					if(extension === 'jpg' || extension === 'png') {
						// Reference make_image_element function from https://ltn.hitomi.la/reader.js
						subdomain += 'b';
						folderName = 'images';
					} else {
						// Reference make_source_element function from https://ltn.hitomi.la/reader.js
						subdomain += 'a';
						folderName = extension;
					}
				} else {
					imagePath = image['hash'].slice(-1) + '/' + image['hash'].slice(-3, -1)  + '/' + image['hash'];
					subdomain = 'tn';
					folderName = (extension === 'avif' ? 'avif' : '') + 'bigtn';
				}

				return 'https://' + subdomain + '.hitomi.la/' + folderName + '/' + imagePath + '.' + extension;
			} else {
				throw new HitomiError('INVALID_VALUE', 'image[\'index\']');
			}
		} else {
			throw new HitomiError('INVALID_VALUE', 'image[\'hash\']');
		}
	}

	export function getVideoUrl(gallery: Gallery): string {
		if(gallery['type'] === 'anime') {
			return 'https://streaming.hitomi.la/videos/' + gallery['title']['display'].toLowerCase().replace(/\s/g, '-') + '.mp4';
		} else {
			throw new HitomiError('INVALID_VALUE', 'gallery[\'type\']');
		}
	}

	export function getGalleryUrl(gallery: Gallery): string {
		return ('https://hitomi.la/' + (gallery['type'] !== 'artistcg' ? gallery['type'] : 'cg') + '/' + encodeURIComponent(Buffer.from(gallery['title']['japanese'] || gallery['title']['display']).slice(0, 200).toString('utf-8')).replace(/\(|\)|'|%(2[0235F]|3[CEF]|5[BD]|7[BD])/g, '-') + (gallery['languageName']['local'] !== null ? '-' + encodeURIComponent(gallery['languageName']['local']) : '') + '-' + gallery['id'] + '.html').toLocaleLowerCase();
	}

	// index

	export function getSecondThumbnailIndex(gallery: Gallery): number {
		return Math.ceil((gallery['files']['length'] - 1) / 2);
	}

	// gallery

	export function getGallery(id: number, options: { includeFiles?: boolean; includeRelatedIds?: boolean; } = {}): Promise<Gallery> {
		if(isInteger(id) && id > 0) {
			return new Promise<Gallery>(function (resolve: (value: Gallery) => void, reject: (reason?: any) => void): void {
				fetchBuffer('https://ltn.hitomi.la/galleries/' + id + '.js')
				.then(function (buffer: Buffer): void {
					const responseJson: LooseObject = JSON.parse(buffer.toString('utf8').slice(18));

					let gallery: Gallery = JSON.parse('{ "id": ' + id + ', "title": { "display": "' + responseJson['title'].replace(/\"/g, '\\"') + '", "japanese": ' + (responseJson['japanese_title'] !== null ? '"' + responseJson['japanese_title'].replace(/\"/g, '\\"') + '"' : 'null') + ' }, "type": "' + responseJson['type'] + '", "languageName": { "english": ' + (responseJson['language'] !== null ? '"' + responseJson['language'] + '"' : 'null') + ', "local": ' + (responseJson['language_localname'] !== null ? '"' + responseJson['language_localname'] + '"' : 'null') + ' }, "artists": [], "groups": [], "series": [], "characters": [], "tags": [], "files": [], "publishedDate": null, "translations": [], "relatedIds": [] }');

					for(let i: number = 0; i < galleryCommonTypes['length']; i++) {
						const pluralType: string = galleryCommonTypes[i] + 's';

						if(responseJson[pluralType] !== null) {
							for(let j: number = 0; j < responseJson[pluralType]['length']; j++) {
								gallery[(pluralType !== 'parodys' ? pluralType : 'series') as 'artists' | 'groups' | 'series' | 'characters'].push(responseJson[pluralType][j][galleryCommonTypes[i]]);
							}
						}
					}

					if(responseJson['tags'] !== null) {
						for(let i: number = 0; i < responseJson['tags']['length']; i++) {
							let type: Tag['type'] = 'tag';

							if(Boolean(responseJson['tags'][i]['male'])) {
								type = 'male';
							} else if(Boolean(responseJson['tags'][i]['female'])) {
								type = 'female';
							}

							gallery['tags'].push({
								type: type,
								name: responseJson['tags'][i]['tag']
							});
						}
					}

					if(options['includeFiles'] ?? true) {
						for(let i: number = 0; i < responseJson['files']['length']; i++) {
							gallery['files'].push({
								index: i,
								hash: responseJson['files'][i]['hash'],
								extension: responseJson['files'][i]['name'].split('.').pop(),
								hasAvif: Boolean(responseJson['files'][i]['hasavif']),
								hasWebp: Boolean(responseJson['files'][i]['haswebp']),
								width: responseJson['files'][i]['width'],
								height: responseJson['files'][i]['height']
							});
						}
					}

					gallery['publishedDate'] = new Date(responseJson['date']);

					if(options['includeRelatedIds'] ?? false) {
						for(let i: number = 0; i < responseJson['languages']['length']; i++) {
							gallery['translations'].push({
								id: Number(responseJson['languages'][i]['galleryid']),
								languageName: {
									english: responseJson['languages'][i]['name'],
									local: responseJson['languages'][i]['language_localname']
								}
							});
						}

						gallery['relatedIds'] = responseJson['related'];
					}

					resolve(gallery);

					return;
				})
				.catch(reject);

				return;
			});
		} else {
			throw new HitomiError('INVALID_VALUE', 'id');
		}
	}

	export function getIds(options: { tags?: Tag[], range?: { startIndex?: number; endIndex?: number; }, orderBy?: OrderCriteria, reverseResult?: boolean; } = {}): Promise<number[]> {
		return new Promise<number[]>(function (resolve: (value: number[]) => void, reject: (reason: any) => void) {
			const [isStartIndexInteger, isEndIndexInteger]: boolean[] = [isInteger(options['range']?.['startIndex']), isInteger(options['range']?.['endIndex'])];

			if(!isStartIndexInteger || options['range']?.['startIndex'] as number >= 0) {
				if(!isEndIndexInteger || (options['range']?.['endIndex'] as number) >= (options['range']?.['startIndex'] as number)) {
					if(Array.isArray(options['tags']) && options['tags']['length'] !== 0) {
						if(typeof(options['orderBy']) === 'undefined' || options['orderBy'] === 'index') {
							options['tags'].reduce(function (promise: Promise<Set<number>>, tag: Tag): Promise<Set<number>> {
								return promise.then(function (ids: Set<number>): Promise<Set<number>> {
									return new Promise<Set<number>>(function (resolve: (value: Set<number>) => void, reject: (reason?: any) => void): void {
										fetchBuffer(getNozomiUrl(tag))
										.then(function (buffer: Buffer): void {
											const isNegativeTag: boolean = tag['isNegative'] || false;
											const _ids: Set<number> = get32BitIntegerNumbers(buffer);

											ids.forEach(function (id: number): void {
												if(isNegativeTag === _ids.has(id)/* !(isNegativeTag ^ _ids.has(id)) */) {
													ids.delete(id);
												}
											});

											resolve(ids);

											return;
										})
										.catch(reject);

										return;
									});
								});
							}, options['tags'][0]['isNegative'] || false ? new Promise<Set<number>>(function (resolve: (value: Set<number>) => void, reject: (reason?: any) => void): void {
								getIds()
								.then(function (ids: number[]): void {
									resolve(new Set<number>(ids));

									return;
								})
								.catch(reject);

								return;
							}) : new Promise<Set<number>>(function (resolve: (value: Set<number>) => void, reject: (reason?: any) => void): void {
								fetchBuffer(getNozomiUrl((options['tags'] as Tag[]).shift() as Tag))
								.then(function (buffer: Buffer): void {
									resolve(get32BitIntegerNumbers(buffer));

									return;
								})
								.catch(reject);

								return;
							}))
							.then(function (ids: Set<number>): void {
								let galleryIds: number[] = Array.from(ids).slice(options['range']?.['startIndex'], options['range']?.['endIndex']);

								if(options['reverseResult'] || false) {
									resolve(galleryIds);
								} else {
									resolve(galleryIds.reverse());
								}

								return;
							})
							.catch(reject);
						} else {
							reject(new HitomiError('INVALID_VALUE', 'options[\'orderBy\']'));
						}
					} else {
						fetchBuffer('https://ltn.hitomi.la/' + (options['orderBy'] || 'index') + '-all.nozomi', { Range: 'bytes=' + (isStartIndexInteger ? options['range']?.['startIndex'] as number * 4 : '0') + '-' + (isEndIndexInteger ? options['range']?.['endIndex'] as number * 4 + 3 : '') })
						.then(function (buffer: Buffer): void {
							let galleryIds: number[] = Array.from(get32BitIntegerNumbers(buffer));

							if(options['reverseResult'] || false) {
								resolve(galleryIds);
							} else {
								resolve(galleryIds.reverse());
							}

							return;
						})
						.catch(reject);
					}
				} else {
					reject(new HitomiError('INVALID_VALUE', 'options[\'range\'][\'endIndex\']'));
				}
			} else {
				reject(new HitomiError('INVALID_VALUE', 'options[\'range\'][\'startIndex\']'));
			}

			return;
		});
	}

	// tag

	export function getParsedTags(tagString: string): Tag[] {
		const splitTagStrings: string[] = tagString.split(' ');

		if(splitTagStrings['length'] !== 0) {
			let tags: Tag[] = [];
			let positiveTagStrings: Set<string> = new Set<string>();

			for(let i: number = 0; i < splitTagStrings['length']; i++) {
				const splitTagStringsWithoutMinus: string[] = splitTagStrings[i].replace(/^-/, '').split(':');

				if(splitTagStringsWithoutMinus['length'] === 2 && /^(artist|group|type|language|series|tag|male|female)$/.test(splitTagStringsWithoutMinus[0]) && /^[^-_\.][a-z0-9-_.]+$/.test(splitTagStringsWithoutMinus[1])) {
					const _tagString: string = splitTagStringsWithoutMinus[0] + ':' + splitTagStringsWithoutMinus[1];

					if(!positiveTagStrings.has(_tagString)) {
						tags.push({
							type: splitTagStringsWithoutMinus[0] as Tag['type'],
							name: splitTagStringsWithoutMinus[1],
							isNegative: splitTagStrings[i].startsWith('-')
						});

						positiveTagStrings.add(_tagString);
					} else {
						throw new HitomiError('DUPLICATED_ELEMENT', 'splitTagStrings[' + i + ']');
					}
				} else {
					throw new HitomiError('INVALID_VALUE', 'splitTagStrings[' + i + ']');
				}
			}

			return tags;
		} else {
			throw new HitomiError('LACK_OF_ELEMENT', 'splitTagStrings');
		}
	}

	export function getTags(type: Tag['type'], options: { startWith?: StartingCharacter } = {}): Promise<Tag[]> {
		return new Promise<Tag[]>(function (resolve: (value: Tag[]) => void, reject: (reason?: any) => void): void {
			if(typeof(options['startWith']) === 'undefined' ? type === 'language' || type === 'type' : type !== 'language' && type !== 'type') {
				if(type !== 'type') {
					fetchBuffer(getTagUrl(type, { startWith: options['startWith'] }))
					.then(function (buffer: Buffer): void {
						const matchedNames: string[] = buffer.toString('utf8').match(RegExp(type === 'language' ? '(?<=")(?!all)[a-z]+(?=":)' : '(?<=\/tag\/' + (type === 'male' || type === 'female' ? type + '%3A' : '') + ')[a-z0-9%]+(?=-all\\.html)', 'g')) || [];
						let tags: Tag[] = [];

						for(let i: number = 0; i < matchedNames['length']; i++) {
							tags.push({
								type: type,
								name: decodeURIComponent(matchedNames[i])
							});
						}

						resolve(tags);

						return;
					})
					.catch(reject);
				} else {
					resolve([{
						type: 'type',
						name: 'doujinshi'
					}, {
						type: 'type',
						name: 'manga'
					}, {
						type: 'type',
						name: 'artistcg'
					}, {
						type: 'type',
						name: 'gamecg'
					}, {
						type: 'type',
						name: 'anime'
					}]);
				}
			} else {
				reject(new HitomiError('INVALID_VALUE', 'options[\'startWith\']'));
			}

			return;
		});
	}
}

export default hitomi;