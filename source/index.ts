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
	const imagePathCode: string = '1643551173';

	// Reference property m of gg variable in https://ltn.hitomi.la/gg.js
	const imageSubdomainRegularExpression: RegExp = /^(0|1(0(0[0-13-6]?|1[1-368-9]|2[47-8]?|3[024-57]|4[0-137]|5[1-46-9]|6[0-246]|7[1-2579]?|8[0-25-79]?|9[38-9])?|1(0[0-16-8]|1[02-48]|2[0-3]|3[024-9]?|4[0-13-9]|5[1-4]?|6[1-357-8]|7[025]|8[2-357-8]|9[0-13-46-7])?|2(0[13-46-79]|1[025]?|2[246-79]|3[0-1359]|4[69]?|5[35-68-9]|6[25-68-9]?|7[19]?|8[279]|9[05-8]?)?|3(0[24-59]?|1[02-35-69]|2[0-246-8]?|3[258-9]?|4[1-357-9]?|5[0-24-57-8]|6[1-24-58]|7[079]|8[02-37-9]?|9[24-69]?)?|4(0[06-79]|1[1-24-58-9]?|2[0-14-6]?|3[0247-8]?|4[0-147-9]?|5[25-68-9]?|6[24-57-8]?|7[6-8]?|8[0-48-9]|9[16])?|5(0[2-35-9]|1[02-35]?|2[1-2468-9]|3[13-7]|4[0-13-4]?|5[5-68-9]?|6[03-5]?|7[02-358]?|8[036-7]?|9[14-68-9]?)|6(0[0269]|1[1-58]?|2[0-1479]|3[03-46-79]|4[0-13-6]|5[13-46-9]|6[268-9]|7[0-13-479]?|8[0-2469]|9[0-13-68]?)|7(0[0-59]|1[04-57]|2[0-25-8]|3[0-35-68-9]|4[36]?|5[0-137-8]|6[1468-9]|7[3-58-9]?|8[0-248-9]?|9[02-46-79]?)?|8(0[157]?|1[0-17-9]?|2[0-159]?|3[0-379]|4[028]|5[0-13-48]|6[0-13-4]?|7[13-48]|8[146-79]|9[357-8])|9(0[05-9]?|1[0-13-57]?|2[1-2579]|3[0-13-5]|4[4-8]?|5[03-7]|6[47]|7[0-257-8]?|8[146-9]|9[13-57-8])?)?|2(0(0[25-6]|1[0-14-57-8]?|2[258-9]|3[47-8]|4[0248-9]|5[0-135-8]|6[0-257-9]?|7[1-359]?|8[0358-9]?|9[24])|1(0[39]|1[0-135-69]?|2[13-47]?|3[046]|4[02-68-9]|5[2-46-8]|6[1-279]|7[0-358]?|8[04-6]?|9[027-8]?)|2(0[06-9]|1[13-4]?|2[1-3]|3[0-136-7]?|4[0-13-49]|5[136]?|6[0-14-6]|7[0-148]?|8[3-46-7]?|9[0-17-9])?|3(0[3-46-7]?|1[26]|2[04-6]|3[1-2]?|4[0-57-8]?|5[0-2479]|6[04-68-9]?|7[46-7]?|8[3-9]|9[1-25-68-9])?|4(0[13-69]|1[1-25]?|2[0-36-9]|3[3-9]|4[0-17-8]?|5[135-8]|6[03-47-9]|7[0-137-8]?|8[1-357-8]|9[2-479]?)?|5(0[03-48]?|1[13-46-8]|27?|3[35-6]?|4[07-9]?|5[46-7]|6[09]?|7[2-368-9]?|8[2-6]|9[0-14-7]?)?|6(0[02479]?|1[0-1359]?|2[0-369]|3[268-9]|4[0-28-9]|5[36-9]|6[137]|7[07-9]|8[0-14-58-9]|9[24-8]?)|7(0[02-357]|1[02-35-79]|2[35-9]?|3[0-18-9]|4[024-57]?|5[4-69]?|6[13-8]?|7[02-359]|8[02-49]|9[02-579]?)|8(0[0-249]?|1[14-57-8]|21?|3[4-57]|4[0-179]|5[1-258]?|6[7-9]?|7[047-8]|8[1-248]?|9[3-468])?|9(0[02-8]?|1[13-579]?|2[0-13-58-9]|3[24-5]|4[1-79]|5[0-24-68]?|6[0-35-68]|7[5-9]|8[15-7]|9[1-28-9]))|3(0(0[0-17-9]|1[0-39]|2[0-14-57-9]?|3[04-59]|4[0-58]|5[0-46]|6[0-24-8]?|7[148-9]|8[038-9]?|9[357])|1(0[4-5]|1[147-8]?|2[479]|3[05-7]?|4[047]|5[038-9]?|6[1-368]|7[0-46-8]|8[02468-9]?|9[1368])|2(0[1-35-68]?|1[0-179]?|2[02-38]|3[0-13-6]|4[14]?|54|6[47]?|7[02-68]|8[0-13-46-7]?|9[02-36]?)|3(0[0-13]?|1[13-46-79]|2[0-1468]|3[0-16-9]?|4[35-6]|5[5-8]?|6[0-258]|7[4-8]?|8[158-9]?|9[0-13-79]?)?|4(0[28-9]?|1[0-24-69]?|2[0-1468]?|3[14-58-9]?|4[0-357-8]|5[08]?|6[2469]|7[2-57]|8[03-68-9]|9[0359])?|5(0[0-146-8]?|1[0-17-8]|2[26-8]?|3[37-8]|4[1-35-6]?|5[1-35-6]?|6[1-24-58-9]?|7[0357-9]|8[5-68-9]?|9[0-135-68-9]?)?|6(0[2-35]?|1[2579]|2[24-68]?|3[0-13-79]|4[0-168]?|5[4-5]?|6[1-368]|7[1-269]|8[1-358-9]?|9[14-579]?)|7(0[1357-9]|1[1-358]?|2[0-18]?|3[15-7]|4[1-247]?|5[5-69]?|6[02-49]?|7[0-1469]?|8[248-9]?|9[368-9]?)|8(0[02-36-8]?|1[146-8]|2[1-36-7]|3[0-1468-9]?|4[0-16-8]|5[0-179]?|6[0-35-69]?|7[13-469]|8[2479]|9[28-9]?)|9(0[0379]|1[13-47-8]?|2[138-9]|3[1-28]?|4[037-8]?|5[0-14-6]?|6[0-15-6]?|7[028-9]|8[03-579]|9[3579]?)?)|4(0(0[0-37]|1[0-15-7]?|2[1-26-79]|3[0247]|4[026-79]?|5[024-9]|6[03-8]|7[5-7]?|8[2-38]|9[15])|1[146-9]?|2[0-257]?|3[02-79]?|4[579]?|5[035-9]|6[58]|7[2-368-9]?|8[35-8]|9[35-6])|5(0[036-79]?|17|2[2-3]?|3[68-9]|4[1-24-57-9]?|5[0-35-79]|6[024-6]|7[268-9]?|8[0-168-9]|9[0-13-57-8]?)?|6(0[4-8]|15|2[138-9]?|3[68-9]|4[357-9]?|5[0-24-59]?|6[13-468]|7[1-37]|8[13-59]|9[0-3579]?)?|7(0[02-35-9]?|1[0-14-9]|2[5-8]|3[035-8]?|4[02-357-8]?|5[0-24-8]|6[2-468-9]?|7[1-46]|8[06-79]?|9[6-8])|8(0[0-14-5]|1[0-249]|2[046]|3[04-579]|4[259]?|5[06]|6[37]|7[26-8]?|8[02-36-8]|9[2-368-9]?)?|9(0[1-57]|1[1-57-8]?|2[027-8]|3[046-8]|4[04-6]?|5[1-259]?|6[02579]?|7[02-47]?|8[19]?|9[14-69]?))$/;
	
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

	export function getIds(options: { tags?: Tag[], range?: { startIndex?: number; endIndex?: number; }, orderBy?: OrderCriteria, reverseResult?: boolean; } = {}): Promise<number[]> {
		return new Promise<number[]>(function (resolve: (value: number[]) => void, reject: (reason: any) => void) {
			const [isStartIndexInteger, isEndIndexInteger]: boolean[] = [isInteger(options['range']?.['startIndex']), isInteger(options['range']?.['endIndex'])];

			if(!isStartIndexInteger || options['range']?.['startIndex'] as number >= 0) {
				if(!isEndIndexInteger || (options['range']?.['endIndex'] as number) >= (options['range']?.['startIndex'] as number)) {
					if(Array.isArray(options['tags']) && options['tags']['length'] !== 0) {
						if(typeof(options['orderBy']) === 'undefined') {
							options['tags'].reduce(function (promise: Promise<Set<number>>, tag: Tag): Promise<Set<number>> {
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
									resolve(get32BitIntegerNumberSet(buffer));
			
									return;
								})
								.catch(reject);
			
								return;
							}))
							.then(function (ids: Set<number>): void {
								resolve(Array.from(ids).slice(options['range']?.['startIndex'], options['range']?.['endIndex']));
			
								return;
							})
							.catch(reject);
						} else {
							reject(new HitomiError('INVALID_VALUE', 'options[\'orderBy\']'));
						}
					} else {
						fetchBuffer('https://ltn.hitomi.la/' + (options['orderBy'] || 'index') + '-all.nozomi', { Range: 'bytes=' + (isStartIndexInteger ? options['range']?.['startIndex'] as number * 4 : '0') + '-' + (isEndIndexInteger ? options['range']?.['endIndex'] as number * 4 + 3 : '') })
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