import { IncomingMessage } from 'http';
import { request, Agent, AgentOptions } from 'https';
import { connect, TLSSocket } from 'tls';
import * as syncrequest from 'sync-request'

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
    const imagePathCode: string = getImagePathCode();

	// Reference property m of gg variable in https://ltn.hitomi.la/gg.js
	const imageSubdomainRegularExpression: RegExp = getImageSubdomainRegularExpression();///^(1(0(0[0-249]?|1[0-13-46-7]?|2[29]?|3[04-57-8]?|4[14-8]|5[14-57]|6[0-13-479]|7[1-357-8]|8[13-8]?|9[1-25-6])?|1(0[0-13-57]?|10?|2[15]?|3[0-13-68]?|4[5-9]?|5[04-57-8]?|6[27-9]|7[03-6]?|8[024-7]|9[02-9]?)?|2(0[024-57-8]?|1[1-26-9]?|2[2-68-9]|3[0-2479]?|4[02-359]?|5[247-8]|6[0-36]|7[2-68]?|8[357]?|9[4-9]?)|3(0[3-47-9]?|1[1-48]|2[0-379]|3[06-7]|4[0-25-69]?|5[468]?|6[5-7]?|7[05-69]|8[029]|9[024-58])|4(0[0-138]|1[0-279]|2[0-2468]?|3[13579]|4[3-47-8]?|5[0246-79]?|6[2-35-68]?|7[1-26-79]?|8[0257]?|9[0-24-7]?)|5(0[0-25-68-9]|1[14-69]|2[0-16-8]|3[1-24]|4[1-2468]|5[0357]?|6[02-35-68-9]|7[1-246-79]|8[0-14-68]|9[25-79]?)?|6(0[03-469]|1[14-57]|2[2-59]|3[1-68]?|4[025-79]|5[3-579]?|6[0369]?|7[2-59]?|8[035-6]?|9[13-58-9]?)?|7(0[68]?|1[18]?|2[02-35-79]?|3[0-8]?|4[38]?|5[2-35-8]?|6[024-79]|7[0357]|8[2-57-9]|9[0-24-7])?|8(0[024-68-9]?|1[1-2479]?|2[0-14-57-9]?|3[2-8]|4[36-7]?|5[036-8]?|6[0247]|7[138]?|8[02-468]?|9[1-247-8])?|9(0[5-6]|1[0-35-9]?|2[02-69]|3[05-6]|4[0-13-69]|5[0-13-47]|6[1-24-7]|7[0-135-8]|8[1-28-9]?|9[0-25-9]?)?)|2(0(0[0-35]?|1[2-46-8]|2[026-79]?|3[0-1]|4[04-57-8]|5[1-36]?|6[0-46-7]?|7[69]?|8[1-35-68-9]?|9[1-479])?|1(0[246-9]|1[0-26-8]?|2[0-35-8]|3[024-57]?|4[0-14-579]?|5[1-2468]?|6[0-14-7]|7[1-27-9]|8[0279]|9[147]?)?|2(0[36-9]|1[0-2469]?|2[024-5]?|3[0-57]?|4[038]|5[03-68]?|6[24-58]|7[1-468]?|8[268]|9[4-79])|3(0[0-1468]|1[02-9]?|2[4-57-8]|3[13-46-7]?|41?|5[1-357]|6[037]?|7[057-9]|8[2-9]?|9[1-268-9]?)|4(0[1-357-9]?|1[268]?|2[025-9]?|3[1579]?|4[1-57-9]?|5[147-8]|6[2-36-7]|7[02-35-8]?|8[14-57-8]|9[35-69])|5(0[25-7]|1[579]|2[1-48]?|3[024-5]?|4[147]?|5[1-257]?|6[02-46-9]?|7[02-46-9]|8[3-46-79]|9[48]?)|6(0[13-68-9]?|1[04-68-9]?|2[0-135-69]|3[1-246]|4[1-28-9]|5[1-2468-9]?|6[35-9]?|7[0-368]?|8[0-46-7]?|9[36])|7(0[3-59]?|1[0248-9]?|2[146-8]?|3[24-68-9]?|4[1-24-7]?|5[24-79]|6[05-69]|7[0268-9]|8[13-57]?|9[05-68-9]?)|8(0[0-14-79]?|1[0-48-9]|2[046-79]?|3[1-259]?|4[05-68-9]|5[1368]?|6[4-69]?|7[035-7]|8[2-46-79]|9[03-579])?|9(0[02579]?|1[04-9]|2[1-25-8]|3[1-68-9]|4[3-579]?|5[04-59]?|6[1-247-9]?|7[0-24-57]?|8[13-47-8]|9[0-13-46-8]?))|3(0(0[3-69]?|1[0-158]?|2[2-35-9]|3[0-14-5]|4[17-9]|5[03]?|6[2-57-8]|7[1-24]|8[36-7]?|9[13-57])|1(0[157-8]|1[025-8]|2[1-24-58]?|3[02-36-7]?|4[0-16-79]|5[0-157-9]|6[02-379]?|7[024-59]?|8[0-246]|9[0-69])?|2(0[02-59]?|1[47-9]|2[3-48]?|3[268]|4[1-7]?|5[0-136-79]|6[04-7]|7[02-47-9]|8[0-359]|9[0-159]?)|3(0[05-8]?|1[0-137]|2[0-137-9]|3[358]|4[168-9]?|5[0-36-8]?|6[3-58-9]?|7[3-46-7]|8[6-9]?|9[1-358-9])?|4(0[0248-9]|1[02-46]?|2[03-8]|3[4-58-9]|4[02-359]|5[13-468-9]|6[3-46-79]?|7[0-135-68]|8[1-47-8]?|9[26-79]?)?|5(0[037-8]|1[035-8]?|2[05-8]|3[0-258-9]|4[0-6]?|5[0368]|6[357]?|7[0-58]|8[1-279]?|9[0-147-9]?)?|6(0[02-58-9]|1[15-68-9]|2[2-357]|3[1-25-7]?|4[257]|5[02-79]|6[29]|7[25-68-9]|8[02-8]?|9[13-46-9])?|7(0[02-359]|1[1-479]?|2[0369]?|3[0-13-59]?|4[49]?|5[1358]|6[035-69]?|7[2-368]?|8[136-79]?|9[1357-8])|8(0[024-69]?|1[0357]?|2[04-579]?|3[0-1368]?|4[0468]?|5[0-14-59]?|6[0-59]?|7[2-69]|8[1-257-9]?|9[2-3579]?)?|9(0[02-469]?|1[0-2468-9]?|2[2-46]|3[02-46]?|4[1-247]?|5[0-247]?|6[79]|7[25-6]?|8[02-47-9]|9[05-9]?))|4(0(0[02-36-79]|1[1-368]|2[2-36-9]?|3[2-36]|4[024-57-8]|5[0-2468-9]?|6[1359]|7[0-269]?|8[0-146-79]|9[1-24]?)?|1[46-9]|2[13-468]?|3[3-68-9]?|4[0-13-57-8]?|5[03-9]|6[02-8]|7[037]?|8[1-28]?|9[15-6]?)?|5(0[04-579]?|1[26-8]|2[1-369]?|3[024-7]?|4[358]?|5[02-49]|6[0-2579]|7[0-246-79]|8[6-9]|9[0-59]?)|6(0[24-8]?|1[26-79]?|2[248]?|3[0248-9]|4[0-169]?|5[0-257-8]?|6[1-3]?|7[0-14-57]|8[2-57-8]|9[0-258-9])?|7(0[1-35]|1[1-35-8]|2[0246-8]|3[1-24-57-9]?|4[0-24-579]|5[04-68]|6[14-59]|7[0-58]|8[246-9]|9[135-79])|8(0[2-69]?|1[0-14-68]?|2[46-8]|3[2-47]?|4[1-35-8]|5[04-579]|6[0-17-8]|7[0-68-9]?|8[257-9]?|9[0-13-479]?)|9(0[0-24-5]?|1[047]|2[035-69]|3[1-4]|4[0-146-8]|5[02-46-8]|6[36-79]|7[0248]?|8[1-246]?|9[14-7]))$/;
    //getImageSubdomainRegularExpression().then(result => imageSubdomainRegularExpression = result);

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

    function getImagePathCode(): string {
        return syncrequest.default('GET', 'https://ltn.hitomi.la/gg.js', {
            headers: {
                'referer': 'https://hitomi.la'
            }
        }).getBody('utf8').split('b: \'')[1].split('\'')[0];
    }

    function getImageSubdomainRegularExpression(): RegExp {
        const response: string = syncrequest.default('GET', 'https://ltn.hitomi.la/gg.js', {
            headers: {
                'referer': 'https://hitomi.la'
            }
        }).getBody('utf8');
        let regex: string = ''
        response.match(/case [0-9]+:/g)!.sort().forEach(e => {
            const num: string = e.split('case ')[1].split(':')[0];
            if(regex == '') regex += num;
            else regex += '|' + num;
        })
        return new RegExp(regex, 'g');
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

	export function getImageUrl(image: Image, extension: Image['extension'] | 'avif' | 'webp', options: { isThumbnail?: boolean; isSmall?: boolean; } = {}): string {
		const isThumbnail: boolean = options['isThumbnail'] || false;
		const isSmall: boolean = options['isSmall'] || false;

		if(!isSmall || isThumbnail && extension === 'avif') {
			switch(extension) {
				case 'jpg':
				case 'png':
				case 'gif': {
					if(!isThumbnail && image['extension'] === extension) {
						break;
					}
				}
	
				case 'webp':
				case 'avif': {
					if(image['has' + extension.charAt(0).toUpperCase() + extension.slice(1) as 'hasWebp' | 'hasAvif']) {
						break;
					}
				}
	
				default: {
					throw new HitomiError('INVALID_VALUE', 'extension');
				}
			}
	
			if(/^[0-9a-f]{64}$/.test(image['hash'])) {
				if(isInteger(image['index']) && image['index'] >= 0) {
					const imageHashCode: string = String(Number.parseInt(image['hash'].slice(-1) + image['hash'].slice(-3, -1), 16));
	
					// Reference subdomain_from_url function from https://ltn.hitomi.la/common.js
					let subdomain = imageSubdomainRegularExpression.test(imageHashCode) ? 'a' : 'b';
					let imagePath: string = '';
					let folderName: string = '';
	
					if(!isThumbnail) {
						imagePath = imagePathCode + '/' + imageHashCode + '/' + image['hash'];
	
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
						subdomain += 'tn';
						folderName = extension + (isSmall && extension === 'avif' ? 'small' : '') + 'bigtn';
					}
	
					return 'https://' + subdomain + '.hitomi.la/' + folderName + '/' + imagePath + '.' + extension;
				} else {
					throw new HitomiError('INVALID_VALUE', 'image[\'index\']');
				}
			} else {
				throw new HitomiError('INVALID_VALUE', 'image[\'hash\']');
			}
		} else {
			throw new HitomiError('INVALID_VALUE', 'extension');
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