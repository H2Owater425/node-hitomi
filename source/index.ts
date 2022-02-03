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
	const imagePathCode: string = '1643882402';

	// Reference property m of gg variable in https://ltn.hitomi.la/gg.js
	const imageSubdomainRegularExpression: RegExp = /^(1(0(0[25-7]?|1[0-24-68-9]?|2[09]|3[24-57]|4[1358-9]|5[5-68-9]|6[02]|7[148-9]?|8[1-36-7]|9[0-1468-9])|1(0[13-469]?|1[179]?|2[1-2468-9]|3[046]?|4[1-35]|5[0-15-9]?|6[0468-9]|7[0359]?|8[0-158-9]|9[13])|2(0[135-79]?|1[3-468-9]|2[1-2]?|3[15-9]?|4[36-79]?|5[1-24-579]|6[1468-9]?|7[024-59]|8[0-136-79]|9[02-379]?)|3(0[02-35-68]?|1[0258-9]?|2[357-8]?|3[2-57-9]?|4[2-36-79]|5[1-25-7]|6[13-57-8]?|7[13-469]?|8[0-1579]?|9[0-158])|4(0[1-257-8]|1[14-57-9]?|2[024-79]|3[0-26-9]|4[06-7]?|5[08]?|6[0-24-579]?|7[02-46-9]|8[046-7]|9[1-27])|5(0[02-68]?|1[0-36-7]|2[138-9]|3[2-368-9]|4[0-14-579]|5[0-24-58-9]?|6[2468-9]|7[0-17]|8[2-379]?|9[039]?)?|6(0[1-24-69]|1[0-137]?|2[246-79]|3[0-27]|4[0-14-68]?|5[2-468]?|6[02-38]?|7[26-8]?|8[1-68]|9[18]?)?|7(0[4-9]|1[13-69]|2[0-135-7]?|3[0-136]?|4[135-8]?|5[2-579]?|6[0-258]?|7[03-57]|8[024-79]|9[1-37-8]?)?|8(0[4-68-9]|1[1469]?|2[0-135-68]|3[4-8]?|4[24-57]?|5[137]|6[3-4]|7[0-2579]|8[02-68-9]?|9[0-26-9])?|9(0[3-59]|1[0-2468]?|2[1-246-79]?|3[35-8]|4[0-3579]|5[2-47-8]|6[02-35-69]?|7[025-9]?|8[1-35]?|9[047]?))?|2(0(0[13-46-8]|1[07]?|2[02-36-7]|3[0-258]|4[68]?|5[24-8]|6[02-368-9]?|7[03-468-9]|8[4-68]?|9[1-25-69])|1(0[5-68-9]?|1[35-68-9]|2[0-1469]|3[17-9]?|4[03-47]|5[4-58-9]|6[03-59]|7[1-37-9]?|8[0-579]|9[0-14-68-9])|2(0[0246-9]?|1[1-25]?|2[046-7]|3[24-58-9]?|4[0246-79]?|5[0246]?|6[147-8]|7[02-35-6]|8[1-24-58]|9[1-26-8]?)|3(0[14-5]?|1[0-14]|2[0-13-59]?|3[47-8]|4[1-357-9]|5[0-14-58]?|6[247-9]?|7[0369]?|8[13-47-9]?|9[1-246-79])|4(0[0-26-79]?|1[0-15-6]|2[35]?|3[1-246-9]?|4[13]|5[135-7]?|6[0-157-9]|7[02-48]?|8[04-57-8]?|9[2479]?)|5(0[36-9]|1[17]?|2[03-46-7]|3[1-46-8]|4[158-9]|5[1-38]|6[0-25-7]?|7[5-8]?|8[02-5]|9[246-9]?)|6(0[24-5]?|1[0-26]|2[04-58-9]?|3[04-79]?|4[2-37]?|5[13-79]|6[0-13-57-9]|7[2-479]|8[1-25-8]|9[0-146-79]?)?|7(0[06]?|1[04-68]|2[2-357-9]?|3[02-357-8]?|4[3-57]|5[24-79]|6[1-8]|7[0-158-9]?|8[058-9]?|9[58-9]?)|8(0[036-79]|1[6-7]|2[028]?|3[14]?|4[0-2468]?|5[0-35-69]|6[13-6]?|7[16-8]?|8[147-9]?|9[14])?|9(0[02-358-9]?|1[0-468-9]|2[13-48]?|3[03-79]|4[02-3]|5[0-248-9]|6[02-469]|7[14-57-9]|8[57]?|9[0468]))|3(0(0[14-68]|1[0-14]?|2[3-46]|3[02479]?|4[46-79]|5[1-25-68-9]?|6[24-579]|7[0-246-79]|8[1-246-79]?|9[3-579]?)|1(0[058-9]|1[2-36]|2[1-357-8]?|3[1-37-9]|4[0-13-47-9]|5[0-47-8]?|6[0-379]?|7[1-36]?|8[0-68-9]?|9[06-9])?|2(0[268-9]?|1[0248]|2[48-9]?|3[246-8]|4[02-6]?|5[2-35-68-9]?|6[46-8]|7[2-357]?|8[159]?|9[24-9]?)|3(0[1-258]|1[0-58]?|2[2-579]?|3[0-13-49]?|4[3-57]|5[02-35-79]|6[039]|7[35-69]?|8[0-1469]?|9[13579]?)|4(0[02-579]|1[357]|2[14-57-8]?|3[4-68-9]|4[0-257]?|5[135-9]?|6[68-9]|7[02-49]?|8[0-246-9]?|9[046-7])|5(0[4-57-9]?|1[1-248-9]?|2[1-24-57-9]|3[24-8]|4[0-2479]|5[0-24-68-9]|6[58-9]?|7[1-24-57]?|8[02469]|9[2-36-9])?|6(0[035-9]?|1[037]?|23|3[0368-9]?|4[0-358]?|5[15]|6[49]?|7[6-9]|8[0-35-6]?|9[04-58])?|7(0[0-135-68-9]?|1[135]?|2[1-2]|3[0-135-7]|4[0-168-9]?|5[0-13]?|6[24-57-8]?|7[13-6]?|8[25-79]|9[0-159])|8(0[1-269]?|1[1-38-9]|2[2-35-6]|3[1-35-69]|4[0-25-6]|5[0-135-68-9]|6[0-148-9]|7[0-158]|8[13]?|9[0357-9]?)?|9(0[028]|1[3-9]?|26|3[0-135-68-9]|4[24-8]|5[1-25]?|6[0-136-7]|7[0-15-7]|8[024-68-9]?|9[0-358-9]?)?)|4(0(0[1-259]?|1[1479]|2[5-7]?|3[26-7]?|4[6-9]|5[02-469]|6[138]?|7[5-68-9]?|8[3-49]|9[0-2]?)?|1[0246-8]?|2[2-479]|3[035-69]|4[146-79]|5[0-257-8]|6[0-1358]|7[1-27-9]|8[026-8]|9[13-46-9])?|5(0[14-68-9]?|1[15-6]|2[359]?|3[0-14-5]?|4[369]|5[137-9]|6[13-48]?|7[2-35-79]?|8[27]|9[0-24-58-9]?)|6(0[0-28]?|1[02-35-7]|2[024]?|3[1-2479]|4[2-49]|5[0-35-68]?|6[2-35-79]|7[06-7]|8[138-9]?|9[13-9])?|7(06|1[05-7]|2[24-579]|3[025-7]|4[048]|5[035-68]|6[0379]?|7[5-79]|8[279]?|9[35-68])|8(0[2-36]?|1[2-47-9]|2[1-38-9]?|3[2-38]?|4[03-46]?|5[47-9]?|6[0-15-68-9]|7[02-468]?|8[0-157-9]|9[24-68]?)|9(0[0248-9]|1[0-14-5]?|2[047]|3[0-14-57-8]|4[16]|5[2-46-8]|6[0-135-8]|7[07-9]|8[03-59]|9[14-68]?)?)$/;

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

	export function getGallery(id: number, options: { includeFiles?: boolean; } = {}): Promise<Gallery> {
		if(isInteger(id) && id > 0) {
			return new Promise<Gallery>(function (resolve: (value: Gallery) => void, reject: (reason?: any) => void): void {
				fetchBuffer('https://ltn.hitomi.la/galleries/' + id + '.js')
				.then(function (buffer: Buffer): void {
					const responseJson: LooseObject = JSON.parse(buffer.toString('utf8').slice(18));

					let gallery: Gallery = JSON.parse('{ "id": ' + id + ', "title": { "display": "' + responseJson['title'].replace(/\"/g, '\\"') + '", "japanese": ' + (responseJson['japanese_title'] !== null ? '"' + responseJson['japanese_title'].replace(/\"/g, '\\"') + '"' : 'null') + ' }, "type": "' + responseJson['type'] + '", "languageName": { "english": ' + (responseJson['language'] !== null ? '"' + responseJson['language'] + '"' : 'null') + ', "local": ' + (responseJson['language_localname'] !== null ? '"' + responseJson['language_localname'] + '"' : 'null') + ' }, "artists": [], "groups": [], "series": [], "characters": [], "tags": [], "files": [], "publishedDate": null }');

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