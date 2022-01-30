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

	// Reference property b of gg variable in https://ltn.hitomi.la/gg.js
	const imagePathCode: string = '1643467685';

	// Reference property m of gg variable in https://ltn.hitomi.la/gg.js
	const imageSubdomainRegularExpression: RegExp = /^(1(0(0[1-36-7]?|1[26]?|2[0-15]|3[25-6]|4[13-46-8]?|5[0-148-9]|6[13-5]|7[157]?|8[14-57-8]|9[02-357-8]?)|1(0[0-68-9]|1[02-369]|2[0268]?|3[24-69]|4[0-15-79]?|5[02-36]?|6[04-9]|7[1-2468-9]?|8[0-57-8]|9[26-7])?|2(0[026-7]?|1[0-468]?|2[04-59]?|3[1-24-9]|4[1-24-58]?|5[17-8]?|6[0246-79]?|7[03-47-8]?|8[0-13-59]|9[1-358-9]?)?|3(0[0-36-8]?|1[28]?|2[0-148]?|3[024-68]?|4[048-9]?|5[024-57]?|6[0-49]?|7[35]?|8[02-35-7]|9[3-79])?|4(0[0359]?|1[13-48]|2[3-46-7]?|3[3-68]?|4[246-9]|5[1-379]|6[0358-9]?|7[0-6]?|8[07-8]|9[2-35-79]?)|5(0[1-27-8]?|1[2-57-8]?|2[036-79]|3[027-9]|4[1-25-79]?|5[1-368-9]?|6[03-46-7]|7[0357-8]?|8[0-137-8]|9[1-58-9])?|6(0[2-58-9]?|1[1-26-79]|2[17]?|3[0-247]?|4[02-37-8]|5[0-16-8]|6[03-79]|7[0-136-8]?|8[0-135-79]|9[13-57-8]?)|7(0[0-1369]|1[1-2469]?|2[0-14-79]?|3[0-13-58]|4[025-9]?|5[37-8]|6[1-35-8]?|7[1-269]|8[5-68]|9[035-69]?)|8(0[2479]?|1[2-3579]?|2[15-68]?|3[0-13-48]|4[246-79]|5[1-27-8]?|6[04-57-8]?|7[025-68-9]?|8[0-13-58-9]?|9[0-58-9]?)|9(0[17-8]?|1[027]|2[1-26-9]?|3[2-358-9]?|4[8-9]|5[5-69]|6[14-9]?|7[0-257-9]|8[0357-8]|9[0-146-79]?)?)|2(0(0[17-9]?|1[1-25-7]?|2[0-247-9]|3[1-24-6]|4[0-579]|5[03-68-9]?|6[136-79]?|7[02-357-8]?|8[37-9]|9[0-14-68]?)|1(0[058]|1[13-58]?|2[0-24-68-9]|3[1-24-8]?|4[24-8]?|5[3-47-8]|6[3-68-9]|7[0-37]?|8[15-68-9]?|9[0-14-59])|2(0[1-35-79]?|1[0-17-9]?|2[1-257]|3[0358-9]?|4[024-68-9]?|5[02-359]|6[07-8]?|72|8[24-8]|9[0-136])?|3(0[0-35-7]?|1[02-579]?|2[04-57]?|3[3-46]|4[0-13-468-9]|5[0-16-79]?|6[1-6]?|7[0-24-58]|8[03-6]|9[1-368]?)|4(0[13-9]|1[0-2468]?|2[468]?|3[0-14-579]|4[24-5]|5[246]|6[2-357-8]|7[13-7]|8[0-24-9]?|9[1-68-9]?)|5(0[0-13-479]|1[0-68-9]|2[1-49]?|3[025-6]?|4[1-258-9]?|5[024-5]|6[2-37]?|7[0-135-68-9]|8[4-68-9]?|9[03-9])|6(0[1468]|1[08-9]?|2[0-14-7]?|3[14]?|4[024-5]|5[0-24-58]|6[157]|7[02-369]?|8[02-57-8]|9[0-19]?)|7(0[24-79]?|1[0-37-8]|2[02-36-9]?|3[1-24-57-8]|4[02-46-79]|5[147-9]|6[0-69]?|7[02-37-9]|8[1-2479]?|9[0-26]?)?|8(0[0-24-59]|1[0-269]|2[037-8]|3[36-8]?|4[479]|5[0-46-9]?|6[3-49]|7[0-36-79]|8[0-36-79]?|9[24-5])|9(0[15-69]?|1[37-9]|2[179]|3[02-579]|4[0-25-79]|5[02-35-6]?|6[1479]?|7[0-24-68-9]|8[1-35-8]|9[047-9]?)?)?|3(0(07?|1[1368]?|2[057-8]?|3[1-27-8]?|4[13-69]?|5[039]?|6[358-9]|7[0479]?|8[02-35-6]|9[1-48]?)|1(0[1-25]|1[2-7]|2[1-35-69]|3[1-246-9]?|4[13-59]?|5[135-68]?|6[1-258]|7[168]?|8[02-579]?|9[1-68])|2(0[246-9]?|1[03-58]?|2[02-46-8]|3[17]|4[02-35-68]?|5[0-258-9]|6[02-468]?|7[35-69]|8[24]?|9[0-39])?|3(0[46]?|1[2-46-9]|2[02-46-9]?|3[024-79]?|4[146-79]|5[1-28-9]?|6[35-68-9]|7[1-28-9]|8[0-13]?|9[04-6]?)?|4(0[1468]|1[03-58-9]?|2[0-13-7]?|3[07-8]|4[02-57]|5[02-36-8]?|6[3-68-9]|7[2-38-9]|8[04-6]|9[2469]?)?|5(0[358-9]|1[04-69]?|2[0469]|33|4[0-15-6]?|5[02-58]?|6[03-468]|7[02-47-8]|8[02-36-9]|9[0-13-579])|6(0[0-1368-9]?|1[05-69]?|2[02-68-9]?|3[03-9]?|4[25-6]?|5[168]?|6[02-49]?|7[02-35-68]|8[35]?|9[2-35-79])|7(0[025-7]?|1[058]?|2[0-35-68-9]?|3[02-579]|4[0-13-59]|5[36-7]|6[4-57-8]|7[0-38-9]|8[13-468-9]|9[0-246-9]?)|8(0[1-468]|1[1-258]|2[02-3]?|3[2-36-9]?|4[3-8]|5[03-47-8]?|6[0-468]|7[0-13-48-9]|8[13-468]|9[2-46-79])|9(0[037-9]|1[0-69]|2[13-48]?|3[0-17-8]?|4[26-7]?|5[0-135-8]|6[02-57-8]|7[047]?|8[04-8]?|9[0-13-9]?))|4(0(0[3-57-9]|1[2479]|2[0-14-57-8]?|3[03-46-79]?|4[1-25-79]?|5[13-46-79]|6[0-24-9]?|7[024-68-9]|8[136]|94?)|1[2-379]?|2[37-9]?|3[1-368]|4[0-28]|5[03-59]|6[269]?|7[0-179]|8[0-26-9]|9[135-79])?|5(0[357-8]|1[024-9]|2[2-468-9]|3[1-37]?|4[0-259]?|5[1-48]?|6[068]?|7[0-359]?|8[1-257]?|9[0-13-57-9])?|6(0[0-59]|1[0-24-59]?|2[0-24-5]?|3[1-27]?|4[0-46-9]?|5[13-46-79]?|6[0-68-9]?|7[1-25-68]?|8[135-68]|9[15-6]?)|7(0[0-35-6]?|1[048-9]?|2[0-59]?|3[06-7]|4[03-46]?|5[1359]|6[2-59]|7[3-58]?|8[024-59]?|9[05-9])|8(0[04-7]|1[0-1358-9]|2[0-147-9]|3[03-57-8]|4[148-9]?|5[0-25-79]?|6[24-68-9]?|7[2-49]|8[6-9]|9[3-49]?)?|9(0[0-46]|1[0-15-79]?|2[0-139]|3[46-79]|4[5-68-9]|5[13-47]?|6[02-38-9]?|7[02-37-8]|8[02-38]|9[1379]))$/;

	const galleryContentParseTypes = ['artist', 'group', 'series', 'character'] as const;

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
				if(!isInteger(range['endIndex']) || range['endIndex'] as number >= range['startIndex']) {
					fetchBuffer('https://ltn.hitomi.la/' + (options['orderBy'] || 'index') + '-all.nozomi', { Range: 'bytes=' + range['startIndex'] * 4 + '-' + ((range['endIndex'] ?? NaN) * 4 + 3 || '') })
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