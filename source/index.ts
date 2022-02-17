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
	const imagePathCode: string = '1645030801';

	// Reference property m of gg variable in https://ltn.hitomi.la/gg.js
	const imageSubdomainRegularExpression: RegExp = /^(1(0(0[02-39]?|1[0-7]?|2[0-68]?|3[29]|4[25]|5[25-68]|6[1-24-9]|7[058]|8[0-1357-8]?|9[2479]?)?|1(0[14-58]?|1[0-146]|2[0-2469]?|3[13-6]?|4[0-47]?|5[14-68]?|6[02-6]|7[0-59]?|8[0-13-58-9]?|9[3-48-9])|2(0[13-46-9]?|1[03-5]?|2[4-6]|3[0-368-9]|4[2-37-9]|5[0-25-68-9]|6[0-35-6]?|7[0-359]?|8[137-8]?|9[1-258-9]?)?|3(0[24-68]|1[03-46-79]|2[0-14-58]|3[158-9]?|4[0-7]|5[1-24-79]?|6[024-57-8]?|7[5-68]|8[1359]|9[0-357-9])?|4(0[14-68]|1[1-246]?|2[17-9]|3[3-79]?|4[03-479]|5[0-135-8]?|6[1-25-9]?|7[1-37-9]?|8[13-8]|9[1-368]?)|5(0[0-24-58-9]|1[13-6]?|2[136]?|3[1-358]?|4[0-13]|5[0-136-8]?|6[0-27-9]?|7[048]?|8[0-158]|9[02-35-8]?)?|6(0[38]|1[38-9]|2[24-57-9]?|3[03-58]|49|5[057]|6[0-35-9]?|7[024-579]?|8[0257-8]?|9[249]?)?|7(0[03-57-9]|1[036-8]?|2[024-59]|3[13-8]|4[13-4]|5[137]|6[059]?|7[0-279]?|8[0-36-79]?|9[3-5]?)?|8(0[4-68]?|1[0-37]|2[1-368-9]|3[0-1358-9]?|4[1469]|5[1-37-8]?|6[0-146-7]?|7[0-2469]|8[0-13579]|9[02-38]?)?|9(0[2-9]?|1[1357]|2[026-9]|3[1-579]?|4[0-14-7]|5[024-57]|6[2-35-69]?|7[16-9]?|8[0-138-9]|9[0-37])?)?|2(0(0[1-357-9]|1[04-6]|2[1-46-79]?|3[2-35]?|4[0358]|5[02-379]?|6[1-46-7]?|7[0-14-57-8]|8[15-7]|9[1-35-6])|1(0[24]|1[03579]?|2[0-13-68-9]?|3[02-35-6]?|4[037]?|5[13-4]|6[0-14-7]?|7[2-468]?|8[1-35-68-9]|9[13-57-9]?)|2(0[0-15]?|1[24-57-8]?|2[1-24-9]?|3[1379]?|4[4-79]?|5[059]?|6[0-24-68-9]?|7[059]?|8[25-9]?|9[0-1469])?|3(0[0-24-58-9]|1[02-37-9]|2[2-35-8]|3[2-35-9]|4[05-69]|5[0-1579]|6[68]|7[25-8]?|8[1-2468-9]|9[02-369]?)?|4(0[04-57-9]|1[36]|2[25-7]?|3[026-9]|4[35-79]?|5[0-13-57]|6[6-9]|7[1-268]|8[246-9]|9[2-358]?)|5(0[0-169]|1[0247-8]?|2[0-1]|3[02-7]|4[0-25-69]?|5[02-79]?|6[1-2]|7[0-25-69]?|8[1-3]|9[2-379])|6(0[0246]|1[2-79]?|2[1358]?|3[0-1468-9]?|4[25-9]|5[135]?|6[15-68]|7[0-579]?|8[14-58]|9[1-24-8]?)?|7(0[0-35-68-9]?|1[1-46-8]|2[24-5]?|3[25-6]?|4[028]?|5[1-27-8]|6[249]|7[18]|8[0-13-46-9]?|9[026-8]?)?|8(0[1-368-9]?|1[0-6]?|2[02468-9]?|3[0-7]?|4[1-58-9]?|5[0-1357]?|6[248-9]?|7[1-25-68]|8[1-25-69]?|9[04-6]?)?|9(0[037-8]|16?|2[024-58-9]?|3[2-468]|4[0-157-9]?|5[158-9]?|6[02-5]?|7[4-79]|8[02-57-9]?|9[1-25-6]))?|3(0(0[0-15-68-9]|1[0-4]|2[0-25-6]?|3[24-58]?|4[2-57-9]?|5[0-137-8]|6[4-79]|7[1-247]?|8[0-13-48]?|9[0-13-58]?)|1(0[1-35-7]?|1[0-14-59]?|2[05-7]|3[13-6]?|4[1-35-68-9]?|5[4-58-9]?|6[03-47]|7[3-48]?|8[1-46-8]|9[35-79])|2(0[048]?|1[0-18]?|2[18-9]?|3[13-469]?|4[0-24-68-9]?|5[0-25-69]|6[26-7]?|7[0-13-48]?|8[3-46-8]|9[0-168-9])?|3(0[02-36-79]|1[0-35]|2[025-68]?|3[469]|4[1-24]|5[1-35]|6[0-3]?|7[13-8]?|8[02-36-7]|9[0-369]?)?|4(0[0-2469]|1[1-246-8]?|2[0-247-9]?|3[2-379]|4[1358-9]?|5[24-58]?|6[18-9]|7[0-13-57]?|8[035-9]|9[0-13-57-9]?)?|5(0[0-26-7]|1[15-6]|2[0246-7]|3[13-46]|4[038-9]|5[0-27-8]|6[135-8]?|7[0-14-6]?|8[35-68-9]|9[1-27-8]?)|6(0[1-469]?|1[0-14-58-9]|2[024-68]?|3[247-8]|4[14-59]?|5[0-25-6]?|6[0-17-9]?|7[1-24-57-9]?|8[1-36-9]?|9[04-68-9])|7(0[0-14-69]|1[0-1357]?|2[068]?|3[0-13-57]|4[6-9]?|5[4-69]?|6[27-8]?|7[13-468]?|8[5-79]|9[6-9])?|8(0[057-9]?|1[2-57-8]?|2[0-247-8]|3[0-24-5]?|4[03-47-8]|5[036-7]|6[0-13579]?|7[24-79]?|8[025]|9[2-359]?)|9(0[02-35-9]?|1[68]|2[02-5]?|3[2-479]?|4[1357-8]?|5[0-16-7]|6[0-136-8]?|7[0-14-57-9]?|8[47-9]?|9[0-26-79]))|4(0(0[0-68-9]|1[13-469]?|2[02-6]?|3[1-35-6]?|4[246-7]?|5[0-28]?|6[1-279]?|76|8[0-14-579]|9[0-24]?)?|1[1-24-9]|2[0-14-57-9]?|3[1-36-8]|4[3-7]|5[2-357]|6[2-358-9]?|7[027-9]?|8[0-13-69]|9[2-579])|5(0[1-29]?|1[02-36-9]?|2[0-14-8]|3[03-479]|4[025]?|5[138-9]?|6[2-5]?|7[1-357-8]|84|9[1-24-69])|6(0[0469]?|1[0-35-68-9]|2[246-79]|3[1579]|4[2-8]?|5[0-579]?|6[35-6]?|7[13-4]?|8[1-257]?|9[1-358-9]?)|7(0[0-13-468]?|1[2-36-79]|2[024-58-9]?|3[02-59]?|4[68]|5[0-359]|6[0579]|7[1-357-8]|8[02-579]?|9[1-68-9])|8(0[0-26-79]|1[146-8]?|2[0-59]?|3[057]?|4[0-2479]|5[0-14-5]?|6[1-24-58]|7[0-24-57-9]|8[02-35-9]?|9[046-9]?)?|9(0[0-249]|1[3-79]?|2[03-69]|3[249]|4[0-13-468-9]?|5[24-68]?|6[0-37-9]|7[05-9]|8[0-15]?|9[0-13-46-79])?)$/;

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