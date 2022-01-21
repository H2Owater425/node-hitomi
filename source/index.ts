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
	}

	export type OrderCriteria = 'index' | 'popularity';

	export type StartingCharacter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | '0-9';

	interface LooseObject {
		[key: string]: any;
	}

	type ErrorKey = 'INVALID_VALUE' | 'DUPLICATED_ELEMENT' | 'LACK_OF_ELEMENT' | 'REQEUST_REJECTED';

	// Reference property b of gg variable in https://ltn.hitomi.la/gg.js
	const imagePathCode: string = '1641389178';

	// Reference property m of gg variable in https://ltn.hitomi.la/gg.js
	const imageSubdomainRegularExpression: RegExp = /^(0|1(0(0[03-57-9]?|1[0-368]|2[246]?|3[03-469]?|4[0-15-69]|5[0-17-9]|6[157-8]|7[2-47-8]|8[2-36-79]?|9[0-1])|1(0[1-2579]?|1[2-46-79]|2[149]|3[2-47-8]?|4[02-35-68-9]?|5[3-4]|6[0-13-9]|7[05-8]|8[0-35-6]?|9[2-379])?|2(0[24-7]|1[4-5]|2[2-37]?|3[2-357-8]?|4[0-27]?|5[0-13-4]?|6[03-46]|7[0-13-57]?|8[03-57]?|96?)|3(0[024-68-9]?|1[0468-9]?|2[358]|3[0268-9]|4[0-135-7]?|5[1468]?|6[08-9]?|7[0-136-8]?|8[024-57-9]?|9[068-9]?)|4(0[139]?|1[02-35-7]|2[03-46-9]|3[0368]?|4[1-36]|5[0-35-69]|6[02-59]|7[1-37-8]?|8[0-47-8]?|9[0-13-46-7])|5(0[03-69]?|1[03-9]?|2[0368]?|3[0-468-9]|4[02-369]?|5[1-246-8]?|6[14-58-9]|7[3-59]|8[2-5]?|9[0468-9]?)|6(0[0-1368-9]?|1[02-49]?|2[48]|3[1-579]?|4[03-468-9]?|5[1357-9]?|6[1359]?|7[3-4]|8[29]|9[3-79]?)?|7(0[0-24-57-8]|1[05-69]|2[25-68-9]|3[146-9]|4[3-8]|5[0-13-49]?|6[047-9]|7[24-58-9]|8[024-58-9]?|9[19])?|8(0[029]?|1[0-157]?|2[2-39]?|3[0357]?|4[2-359]|5[024-58]?|6[026]|7[14]?|83?|9[0-369])?|9(0[0-13-5]|1[0-368-9]?|2[3-46]?|3[1-358]?|4[13-49]?|5[1-24-79]?|6[26]?|7[1-37]|8[79]|9[1369]?)?)?|2(0(0[13-68-9]|1[1-47]|2[02-46-9]?|3[2-46-9]?|4[47-8]|5[0-146-7]?|6[046-79]|7[0-24-57-8]?|8[13-57]|9[02-36-79]?)?|1(0[0-158]|1[268-9]?|2[0-15-9]|3[1468]|4[0-35-79]?|5[0-13-4]?|6[47]|7[02-5]|8[0-26-79]?|9[468]?)?|2(06|1[4-58-9]|2[0-13579]|3[0-24-7]?|45|5[1-368-9]?|6[1-2468-9]|7[0-48-9]|8[0-25-68]?|9[2-579])|3(0[036-9]?|1[02468]?|2[0-15-79]|3[0-369]|4[0246-7]|5[02]?|6[0-16-79]?|7[02-35-79]|8[0-35-69]?|94)?|4(0[1-24-59]?|1[1-24-58]|2[13-7]?|3[02-46-79]?|4[0-68-9]|5[4-8]|6[1357-9]|7[0-48]?|8[037]?|9[0-246-8]?)?|5(0[2468]?|1[024-58-9]?|2[1-35-79]?|3[0-26-9]|4[2-357-9]?|5[37]?|6[0-247-9]|7[4-579]?|8[26-7]?|9[1-8]?)|6(0[13-79]|1[1-25-68]|2[057-8]?|3[46-9]|4[136-8]|5[14-57]|6[5-68-9]?|7[46-7]?|8[1-24-59]|9[03-6])?|7(0[0-35-68-9]?|1[079]|2[257-9]?|3[02-3]?|4[1-357-8]|5[2468-9]?|6[04-8]|7[0-17-9]|8[1-57-9]|9[79])|8(0[248-9]?|1[024-57-9]?|2[14]?|3[0-279]?|4[1-24-57-9]|5[02-35-68-9]|6[2-35-69]|7[03-46-8]?|8[0-24]|9[13-4])|9(0[046-8]?|1[0-358-9]|2[13-469]|3[03]?|4[0-27-8]|5[2-368-9]|6[0-13-579]?|7[49]|8[1-68]?|9[04-8]?)?)|3(0(0[0-136-8]|1[0-1468-9]?|2[0-135-9]?|3[13-69]?|4[1368]?|5[0-5]|6[1-24-9]|7[158]?|8[02-46-7]|9[024-6]?)|1(0[2-35-69]?|1[35-7]?|2[0-246-9]?|3[057]|4[024-58]|5[79]?|6[35-9]?|7[0-68-9]|8[0368-9]?|9[04-79]?)|2(0[0-2469]|1[0-358-9]|2[17-8]?|3[1-68-9]|4[13-46-8]|5[1-357-9]|6[14-8]?|7[059]|8[26-9]?|9[15-69])?|3(0[02-357-8]|1[03-69]|2[0269]?|3[0-35-79]?|4[3-57-9]?|5[357-9]?|6[03-46-7]?|7[1-25-68]|8[02-57-9]|9[0-69]?)?|4(0[0-36]?|1[36-9]?|2[02-38-9]|3[24-58]?|4[3-46]?|5[0-148-9]?|6[179]|7[369]|8[0-13-469]|9[02-6]?)|5(0[03-479]|1[13-79]|2[1-246-79]?|3[2-357]|4[1-46-7]|5[02-57-8]|6[02-36-8]?|7[2-59]?|8[03-57-9]|9[036-7])?|6(0[024-79]|16?|2[25-69]|3[2-359]|4[1-24-8]|5[35-6]?|6[2-46-79]?|7[0-14-9]?|8[25-79]|9[0-38]?)?|7(0[0-24-57]|1[0-46-9]?|2[0259]?|3[0-179]?|4[0-38]?|5[1-35-9]?|6[1-357-8]|7[1-468]?|8[46-9]?|9[0-13-46-7])|8(0[2-57-9]?|1[0-15-69]|2[2-46-8]?|3[1-46-8]?|4[0-135-69]|5[35-9]|6[03-468]?|7[0-28]?|8[14-57]?|9[0248])?|9(0[269]?|1[024-59]|2[0-8]?|3[02-57-9]|4[03-69]|5[0-14-579]|6[1-24-58-9]|7[4-69]?|8[1-35-9]?|9[1-2469]?))|4(0(0[2-579]|1[0-468-9]|2[07]?|3[0-1358]|4[026-8]|5[036]?|6[03579]|7[1-246-9]|8[468-9]|9[2-5])?|11|2[1-46]?|3[0-13-59]?|4[35-9]|5[24-7]|6[2-35-68-9]|7[03-579]?|8[0-13-7]?|9[02-468-9]?)?|5(0[0-24-57-8]?|1[37]?|2[1-3]?|3[027]?|4[4-579]|5[0-24-57-9]?|6[02-38-9]?|7[04-79]|8[0-13-58-9]|9[247-9])|6(0[0-24-68]|1[025-68]?|2[4-8]|3[257-8]?|4[02-57-9]?|5[3-69]?|6[1-28-9]|7[0-2479]|8[0-148]?|9[4-5]?)|7(0[025-7]?|1[1-48]|3[1-68-9]|4[1-35-8]?|54|6[4-69]|7[02-46-7]?|8[025-8]|9[25]?)?|8(0[1-46-8]|1[247-9]|2[1-35-9]?|3[3-46-79]?|4[0-2468-9]?|5[16-79]|6[0-14-79]?|7[3-59]|8[1-35-6]|9[1-24-79]?)?|9(0[13-47]?|1[357-8]?|2[0258]|3[0357-9]?|4[026-9]?|5[3-46-8]?|6[0-15-69]?|7[0-24-68]|8[4-57-9]|9[2-7]?))$/;

	const galleryContentParseTypes = ['artist', 'group', 'series', 'character'] as const;

	// utility

	function getErrorMessage(key: ErrorKey, ..._arguments: any[]): string {
		switch(key) {
			case 'INVALID_VALUE': {
				return 'Value of \'' + _arguments[0] + '\' was not valid';
			}

			case 'DUPLICATED_ELEMENT': {
				return 'Element of \'' + _arguments[0] + '\' was duplicated';
			}

			case 'LACK_OF_ELEMENT': {
				return 'Elements of \'' + _arguments[0] + '\' was not enough';
			}

			case 'REQEUST_REJECTED': {
				return 'Request to \'' + _arguments[0] + '\' was rejected';
			}
		}
	}

	class HitomiError extends Error {
		private code: ErrorKey;

		constructor(key: ErrorKey, ..._arguments: any[]) {
			super(getErrorMessage(key, _arguments));

			this['code'] = key;
		}

		get name(): string {
			return 'HitomiError [' + this['code'] + ']';
		}
	}

	class _Agent extends Agent {
		public createConnection(options: AgentOptions, callback?: () => void): TLSSocket {
			options['servername'] = undefined;
			
			return connect(options, callback);
		}
	}

	function isInteger(value: any): boolean {
		return Number.parseInt(value) === Number(value) && Number.isFinite(value) && typeof(value) !== 'object';
	}

	function get32BitIntegerNumberSet(buffer: Buffer, options: { splitBy?: number } = {}): Set<number> {
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

	const agent: _Agent = new _Agent({ rejectUnauthorized: false, keepAlive: true });

	function fetchBuffer(url: string, header?: LooseObject): Promise<Buffer> {
		return new Promise<Buffer>(function (resolve: (value: Buffer) => void, reject: (reason?: any) => void): void {
			const _url: URL = new URL(url);

			request({
				hostname: _url['hostname'],
				path: _url['pathname'],
				method: 'GET',
				port: 443,
				headers: Object.assign({}, header, {
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
		return 'https://streaming.hitomi.la/videos/' + gallery['title']['display'].toLowerCase().replace(/\s/g, '-') + '.mp4';
	}

	export function getGalleryUrl(gallery: Gallery): string {
		return ('https://hitomi.la/' + (gallery['type'] !== 'artistcg' ? gallery['type'] : 'cg') + '/' + encodeURIComponent(Buffer.from(gallery['title']['japanese'] || gallery['title']['display']).slice(0, 200).toString('utf-8')).replace(/\(|\)|'|%(2[0235F]|3[CEF]|5[BD]|7[BD])/g, '-') + (gallery['languageName']['local'] !== null ? '-' + encodeURIComponent(gallery['languageName']['local']) : '') + '-' + gallery['id'] + '.html').toLocaleLowerCase();
	}

	// index

	export function getSecondThumbnailIndex(gallery: Gallery): number {
		return Math.ceil((gallery['files']['length'] - 1) / 2);
	}

	// gallery

	export function getGallery(id: number, options: { includeFullData?: boolean; includeFiles?: boolean; } = {}): Promise<Gallery> {
		if(isInteger(id) && id > 0) {
			return new Promise<Gallery>(function (resolve: (value: Gallery) => void, reject: (reason?: any) => void): void {
				fetchBuffer('https://ltn.hitomi.la/galleries/' + id + '.js')
				.then(function (buffer: Buffer): void {
					const responseJson: LooseObject = JSON.parse(buffer.toString('utf8').slice(18));

					let gallery: Gallery = JSON.parse('{ "id": ' + responseJson['id'] + ', "title": { "display": "' + responseJson['title'].replace(/\"/g, '\\"') + '", "japanese": ' + (responseJson['japanese_title'] !== null ? '"' + responseJson['japanese_title'].replace(/\"/g, '\\"') + '"' : 'null') + ' }, "type": "' + responseJson['type'] + '", "languageName": { "english": ' + (responseJson['language'] !== null ? '"' + responseJson['language'] + '"' : 'null') + ', "local": ' + (responseJson['language_localname'] !== null ? '"' + responseJson['language_localname'] + '"' : 'null') + ' }, "artists": [], "groups": [], "series": [], "characters": [], "tags": [], "files": [], "publishedDate": null }');
					
					gallery['publishedDate'] = new Date(responseJson['date']);

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

					if(options['includeFullData'] ?? true) {
						fetchBuffer(getGalleryUrl(gallery))
						.then(function (_buffer: Buffer): void {
							const galleryContentHtml: string = _buffer.toString('utf8').split('content">')[1];

							if(typeof(galleryContentHtml) !== 'undefined') {
								for(let i: number = 0; i < galleryContentParseTypes['length']; i++) {
									const matchedStrings: string[] = galleryContentHtml.match(RegExp('(?<=\/' + galleryContentParseTypes[i] + '\/)[A-z0-9%]+(?=-all\\.html)', 'g')) || [];

									for(let j: number = 0; j < matchedStrings['length']; j++) {
										// @ts-expect-error :: Since using combination of string as key, typescript detects error
										gallery[galleryContentParseTypes[i] !== 'series' ? galleryContentParseTypes[i] + 's' : 'series'].push(decodeURIComponent(matchedStrings[j]));
									}
								}
							}

							resolve(gallery);

							return;
						})
						.catch(reject);
					} else {
						resolve(gallery);
					}

					return;
				})
				.catch(reject);

				return;
			});
		} else {
			throw new HitomiError('INVALID_VALUE', 'id');
		}
	}

	export function getIds(range: { startIndex: number; endIndex?: number; }, options: { orderBy?: OrderCriteria, reverseResult?: boolean; } = {}): Promise<number[]> {
		return new Promise<number[]>(function (resolve: (value: number[]) => void, reject: (reason: any) => void) {
			if(isInteger(range['startIndex']) && range['startIndex'] >= 0) {
				if(!isInteger(range['endIndex']) || range['endIndex'] as number > range['startIndex']) {
					fetchBuffer('https://ltn.hitomi.la/' + (options['orderBy'] || 'index') + '-all.nozomi', { Range: 'bytes=' + range['startIndex'] * 4 + '-' + ((range['endIndex'] || NaN) * 4 + 3 || '') })
					.then(function (buffer: Buffer): void {
						let galleryIds: number[] = Array.from(get32BitIntegerNumberSet(buffer));
	
						if(options['reverseResult'] || false) {
							resolve(galleryIds);
						} else {
							resolve(galleryIds.reverse());
						}
	
						return;
					})
					.catch(reject);
				} else {
					reject(new HitomiError('INVALID_VALUE', 'range[\'endIndex\']'));
				}
			} else {
				reject(new HitomiError('INVALID_VALUE', 'range[\'startIndex\']'));
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

	export function getQueriedIds(tags: Tag[]): Promise<number[]> {
		return new Promise<number[]>(function (resolve: (value: number[]) => void, reject: (reason?: any) => void): void {
			if(tags['length'] > 1) {
				tags.sort(function (a: Tag, b: Tag): number {
					if(!(a['isNegative'] || false)) {
						if(!(b['isNegative'] || false)) {
							return 0;
						} else {
							return -1;
						}
					} else {
						return 1;
					}
				});

				tags.reduce(function (promise: Promise<Set<number>>, tag: Tag): Promise<Set<number>> {
					return promise.then(function (ids: Set<number>): Promise<Set<number>> {
						return new Promise<Set<number>>(function (resolve: (value: Set<number>) => void, reject: (reason?: any) => void): void {
							fetchBuffer(getNozomiUrl(tag))
							.then(function (buffer: Buffer): void {
								const isNegativeTag: boolean = tag['isNegative'] || false;
								const _ids: Set<number> = get32BitIntegerNumberSet(buffer);

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
				}, tags[0]['isNegative'] || false ? new Promise<Set<number>>(function (resolve: (value: Set<number>) => void, reject: (reason?: any) => void): void {
					getIds({ startIndex: 0 })
					.then(function (ids: number[]): void {
						resolve(new Set<number>(ids));

						return;
					})
					.catch(reject);

					return;
				}) : new Promise<Set<number>>(function (resolve: (value: Set<number>) => void, reject: (reason?: any) => void): void {
					fetchBuffer(getNozomiUrl(tags.shift() as Tag))
					.then(function (buffer: Buffer): void {
						resolve(get32BitIntegerNumberSet(buffer));

						return;
					})
					.catch(reject);

					return;
				}))
				.then(function (ids: Set<number>): void {
					resolve(Array.from(ids));

					return;
				})
				.catch(reject);

				return;
			} else {
				throw new HitomiError('LACK_OF_ELEMENT', 'tags');
			}
		});
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