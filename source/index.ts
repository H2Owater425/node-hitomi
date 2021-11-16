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

	export type TagType = 'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag';

	export interface Tag {
		type: TagType;
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

	const galleryContentParseTypes = ['artist', 'group', 'series', 'character'] as const;

	// utility

	function getErrorMessage(key: ErrorKey, ..._arguments: any[]): string {
		switch(key) {
			case 'INVALID_VALUE':
				return 'Value of \'' + _arguments[0] + '\' was not valid';
			case 'DUPLICATED_ELEMENT':
				return 'Element of \'' + _arguments[0] + '\' was duplicated';
			case 'LACK_OF_ELEMENT':
				return 'Elements of \'' + _arguments[0] + '\' was not enough';
			case 'REQEUST_REJECTED':
				return 'Request to \'' + _arguments[0] + '\' was rejected';
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
		if(Number.parseInt(value) === Number(value) && Number.isFinite(value) && typeof(value) !== 'object') {
			return true;
		} else {
			return false;
		}
	}

	function get32BitIntegerNumberSet(buffer: Buffer, option?: { splitBy?: number }): Set<number> {
		const splitCriteria: number = option?.['splitBy'] || 4;

		let arrayBuffer: ArrayBuffer = new ArrayBuffer(buffer['byteLength']);
		let unit8Array: Uint8Array = new Uint8Array(arrayBuffer);

		for (let i: number = 0; i < buffer['byteLength']; ++i) {
			unit8Array[i] = buffer[i];
		}

		const dataView: DataView = new DataView(arrayBuffer);
		const totalLength: number = dataView['byteLength'] / splitCriteria;

		let numberSet: Set<number> = new Set<number>();

		for(let i: number = 0; i < totalLength; i++) {
			numberSet.add(dataView.getInt32(i * splitCriteria, false));
		}

		return numberSet;
	}

	const agent: _Agent = new _Agent({ rejectUnauthorized: false, keepAlive: true });

	function fetchBuffer(url: string, header?: LooseObject): Promise<Buffer> {
		return new Promise<Buffer>(function (resolve: (value: Buffer | PromiseLike<Buffer>) => void, reject: (reason?: any) => void): void {
			const _url: URL = new URL(url);

			request({
				hostname: _url['hostname'],
				path: _url['pathname'],
				method: 'GET',
				port: 443,
				headers: {
					'Accept': '*/*',
					'Connection': 'keep-alive',
					...header
				},
				agent: agent
			}, function (response: IncomingMessage): void {
				let buffers: Buffer[] = [];
				let bufferLength: number = 0;

				if(response['statusCode'] === 200 || response['statusCode'] === 206) {
					response.on('data', function (chunk: any): void {
						buffers.push(chunk);
						bufferLength += chunk['byteLength'];
	
						return;
					})
					.on('error', function (error: Error): void {
						reject(new HitomiError('REQEUST_REJECTED', url));
	
						return;
					})
					.on('end', function (): void {
						resolve(Buffer.concat(buffers, bufferLength));
	
						return;
					});
				} else {
					reject(new HitomiError('REQEUST_REJECTED', url));
				}

				return;
			}).on('error', function (error: Error): void {
				reject(new HitomiError('REQEUST_REJECTED', url));

				return;
			})
			.end();

			return;
		});
	}

	// url resolver

	export function getImageUrl(image: Image, extension: Image['extension'] | 'avif' | 'webp', option?: { isThumbnail?: boolean; }): string {
		const isThumbnail: boolean = option?.['isThumbnail'] ?? false;

		switch(extension) {
			case 'jpg':
				if(image['extension'] !== 'jpg') {
					throw new HitomiError('INVALID_VALUE', 'extension');
				} else {
					break;
				}
			case 'png':
				if(isThumbnail || image['extension'] !== 'png') {
					throw new HitomiError('INVALID_VALUE', 'extension');
				} else {
					break;
				}
			case 'avif':
				if(!image['hasAvif']) {
					throw new HitomiError('INVALID_VALUE', 'extension');
				} else {
					break;
				}
			case 'webp':
				if(isThumbnail || !image['hasWebp']) {
					throw new HitomiError('INVALID_VALUE', 'extension');
				} else {
					break;
				}
			case 'gif':
				if(isThumbnail || image['extension'] !== 'gif') {
					throw new HitomiError('INVALID_VALUE', 'extension');
				} else {
					break;
				}
		}

		if(!/^[0-9a-f]{64}$/.test(image['hash'])) {
			throw new HitomiError('INVALID_VALUE', 'image[\'hash\']');
		} else if(!isInteger(image['index']) || image['index'] < 0) {
			throw new HitomiError('INVALID_VALUE', 'image[\'index\']');
		} else {
			const imagePath: string = image['hash'].slice(-1) + '/' + image['hash']
			.slice(-3, -1) + '/' + image['hash'];
			
			let subdomain: string = '';
			let folderName: string = '';

			if(!isThumbnail) {
				//let frontendCount: number = 3; Not used anymore
				let hexadecimalId: number = Number.parseInt(image['hash']
				.slice(-3, -1), 16)

				subdomain = String.fromCharCode(hexadecimalId < 124 /* 0x7c */ ? 98 : 97);

				if(extension === 'jpg' || extension === 'png') {
					subdomain += 'b';
					folderName = 'images';
				} else {
					subdomain += 'a';
					folderName = extension;
				}
			} else {
				subdomain = 'tn';
				folderName = (extension === 'avif' ? 'avif' : '') + 'bigtn';
			}

			return 'https://' + subdomain + '.hitomi.la/' + folderName + '/' + imagePath + '.' + extension;
		}
	}

	export function getVideoUrl(gallery: Gallery): string {
		return 'https://streaming.hitomi.la/videos/' + gallery['title']['display'].toLowerCase()
		.replace(/\s/g, '-') + '.mp4';
	}

	export function getGalleryUrl(gallery: Gallery): string {
		return ('https://hitomi.la/' + (gallery['type'] !== 'artistcg' ? gallery['type'] : 'cg') + '/' + encodeURIComponent(Buffer.from(gallery['title']['japanese'] || gallery['title']['display'])
		.slice(0, 200)
		.toString('utf-8'))
		.replace(/\(|\)|'|%(2(0|2|3|5|F)|3(C|E|F)|5(B|D)|7(B|D))/g, '-') + (gallery['languageName']['local'] !== null ? '-' + encodeURIComponent(gallery['languageName']['local']) : '') + '-' + gallery['id'] + '.html').toLocaleLowerCase();
	}

	export function getNozomiUrl(tag: Tag, option?: { orderBy?: OrderCriteria }): string {
		if(tag['type'] !== 'language' && typeof(option?.['orderBy']) !== 'undefined') {
			throw new HitomiError('INVALID_VALUE', 'option[\'orderBy\']');
		} else {
			const orderCriteria: OrderCriteria = option?.['orderBy'] || 'index';

			let area: string = '';
			let tagString: string = '';
			let language: string = 'all';

			switch(tag['type']) {
				case 'male':
				case 'female':
					area = 'tag/';
					tagString = tag['type'] + ':' + tag['name'].replace(/_/g, ' ');

					break;
				case 'language':
					tagString = orderCriteria;
					language = tag['name'];

					break;
				default:
					area = tag['type'] + '/';
					tagString = tag['name'].replace(/_/g, ' ');

					break;
			}

			return 'https://ltn.hitomi.la/n/' + area + tagString + '-' + language + '.nozomi';
		}
	}

	export function getTagUrl(type: TagType, option: { startWith: StartingCharacter }): string {
		const startingCharacter: StartingCharacter = option['startWith'];

		let url: string = 'hitomi.la/';

		switch(type) {
			case 'tag':
			case 'male':
			case 'female':
				url += 'alltags-';

				break;
			case 'artist':
				url += 'allartists-';

				break;
			case 'series':
				url += 'allseries-';

				break;
			case 'character':
				url += 'allcharacters-';

				break;
			case 'group':
				url += 'allgroups-';

				break;
			case 'language':
				url = 'ltn.' + url + 'language_support.js';

				break;
		}

		url = 'https://' + url;

		if(type !== 'language') {
			if(type === 'male') {
				url += 'm';
			} else if(type === 'female') {
				url += 'f';
			} else {
				url += startingCharacter !== '0-9' ? startingCharacter : '123';
			}

			return url + '.html';
		} else {
			return url;
		}
	}

	// index

	export function getSecondThumbnailIndex(gallery: Gallery): number {
		return Math.ceil((gallery['files']['length'] - 1) / 2);
	}

	// gallery

	export function getGallery(id: number, option?: { includeFullData?: boolean; includeFiles?: boolean; }): Promise<Gallery> {
		if(!isInteger(id) || (isInteger(id) && id < 1)) {
			throw new HitomiError('INVALID_VALUE', 'id');
		} else {
			const includeFiles: boolean = option?.['includeFiles'] ?? true;
			const includeFullData: boolean = option?.['includeFullData'] ?? true;

			return new Promise<Gallery>(function (resolve: (value: Gallery | PromiseLike<Gallery>) => void, reject: (reason?: any) => void): void {
				fetchBuffer('https://ltn.hitomi.la/galleries/' + id + '.js').then(function (buffer: Buffer): void | PromiseLike<void> {
					const responseJson: LooseObject = JSON.parse(buffer.toString('utf8')
					.slice(18));

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

					if(includeFiles) {
						for(let i: number = 0; i < responseJson['files']['length']; i++) {
							gallery['files'].push({
								index: i,
								hash: responseJson['files'][i]['hash'],
								extension: responseJson['files'][i]['name'].split('.')
								.pop(),
								hasAvif: Boolean(responseJson['files'][i]['hasavif']),
								hasWebp: Boolean(responseJson['files'][i]['haswebp']),
								width: responseJson['files'][i]['width'],
								height: responseJson['files'][i]['height']
							});
						}
					}

					if(includeFullData) {
						fetchBuffer(getGalleryUrl(gallery)).then(function (_buffer: Buffer): void | PromiseLike<void> {
							const galleryContentHtml: string = _buffer.toString('utf8')
							.split('content">')[1];

							if(typeof(galleryContentHtml) !== 'undefined') {
								for(let i: number = 0; i < galleryContentParseTypes['length']; i++) {
									const matchedStrings: string[] = galleryContentHtml.match(RegExp('(?<=\/' + galleryContentParseTypes[i] + '\/)[A-z0-9%]+(?=-all\\.html)', 'g')) || [];

									for(let j: number = 0; j < matchedStrings['length']; j++) {
										// @ts-expect-error :: Since using combination of string as key, typescript detects error. But still, works fine!
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
		}
	}

	export function getIds(range: { startIndex: number; endIndex?: number; }, option?: { orderBy?: OrderCriteria, reverseResult?: boolean; }): Promise<number[]> {
		return new Promise<number[]>(function (resolve: (value: number[] | PromiseLike<number[]>) => void, reject: (reason: any) => void) {
			if(!isInteger(range['startIndex']) || (isInteger(range['startIndex']) && range['startIndex'] < 0)) {
				reject(new HitomiError('INVALID_VALUE', 'range[\'startIndex\']'));
			} else if(typeof(range['endIndex']) !== 'undefined' && (!isInteger(range['endIndex']) || (isInteger(range['endIndex']) && range['endIndex'] <= range['startIndex']))) {
				reject(new HitomiError('INVALID_VALUE', 'range[\'endIndex\']'));
			} else {
				const startByte: number = range['startIndex'] * 4;
				const endByte: number | string = startByte + (range?.['endIndex'] || NaN) * 4 + 3 || '';
				const orderCriteria: OrderCriteria = option?.['orderBy'] || 'index';
				const reverseResult: boolean = option?.['reverseResult'] ?? false;

				fetchBuffer('https://ltn.hitomi.la/' + orderCriteria + '-all.nozomi', { Range: 'bytes=' + startByte + '-' + endByte }).then(function (buffer: Buffer): void | PromiseLike<void> {
					let galleryIds: number[] = Array.from(get32BitIntegerNumberSet(buffer));

					if(reverseResult) {
						resolve(galleryIds);
					} else {
						resolve(galleryIds.reverse());
					}

					return;
				})
				.catch(reject);
			}

			return;
		});
	}

	// tag

	export function getParsedTags(tagString: string): Tag[] {
		const splitTagStrings: string[] = tagString.split(' ');

		if(splitTagStrings['length'] < 1) {
			throw new HitomiError('LACK_OF_ELEMENT', 'splitTagStrings');
		} else {
			let tags: Tag[] = [];
			let positiveTagStrings: string[] = [];

			for(let i: number = 0; i < splitTagStrings['length']; i++) {
				const splitTagStringsWithoutMinus: string[] = splitTagStrings[i].replace(/^-/, '')
				.split(':');

				if(splitTagStringsWithoutMinus['length'] !== 2 || typeof(splitTagStringsWithoutMinus[0]) === 'undefined' || typeof(splitTagStringsWithoutMinus[1]) === 'undefined' || splitTagStringsWithoutMinus[0] === '' || splitTagStringsWithoutMinus[1] === '' || !/^(artist|group|type|language|series|tag|male|female)$/.test(splitTagStringsWithoutMinus[0]) || !/^[^-_\.][a-z0-9-_.]+$/.test(splitTagStringsWithoutMinus[1])) {
					throw new HitomiError('INVALID_VALUE', 'splitTagStrings[' + i + ']');
				} else {
					const _tagString: string = splitTagStringsWithoutMinus[0] + ':' + splitTagStringsWithoutMinus[1];

					if(positiveTagStrings.includes(_tagString)) {
						throw new HitomiError('DUPLICATED_ELEMENT', 'tags')
					} else {
						tags.push({
							// @ts-expect-error :: Since type element of Tag in node-hitomi is based on hitomi tag, parsing it will return corresponding type value
							type: splitTagStringsWithoutMinus[0],
							name: splitTagStringsWithoutMinus[1],
							isNegative: splitTagStrings[i].startsWith('-')
						});

						positiveTagStrings.push(_tagString);
					}
				}
			}

			return tags;
		}
	}

	export function getQueriedIds(tags: Tag[]): Promise<number[]> {
		return new Promise<number[]>(function (resolve: (value: number[] | PromiseLike<number[]>) => void, reject: (reason?: any) => void): void {
			if(tags['length'] < 1) {
				throw new HitomiError('LACK_OF_ELEMENT', 'tags');
			} else {
				tags.sort(function (a: Tag, b: Tag): number {
					const [isANegative, isBNegative]: boolean[] = [a?.['isNegative'] ?? false, b?.['isNegative'] ?? false]

					if(!isANegative && !isBNegative){
						return 0;
					} else if(!isANegative) {
						return -1;
					} else {
						return 1;
					}
				});

				let idSet: Set<number> = new Set<number>();
				let filterPromises: Promise<Set<number>>[] = [];

				for(let i: number = 0; i < tags['length']; i++) {
					filterPromises.push(new Promise<Set<number>>(function (resolve: (value: Set<number> | PromiseLike<Set<number>>) => void, reject: (reason?: any) => void): void {
						fetchBuffer(getNozomiUrl(tags[i])).then(function (buffer: Buffer): void | PromiseLike<void> {
							resolve(get32BitIntegerNumberSet(buffer));

							return;
						})
						.catch(reject);

						return;
					}));
				}

				filterPromises.push(new Promise<Set<number>>(function (resolve: (value: Set<number> | PromiseLike<Set<number>>) => void, reject: (reason?: any) => void): void {
					resolve(new Set<number>());
				}));

				if(tags[0]['isNegative'] ?? false) {
					// Not affecting result, but to run properly it is needed to unshift one tag.
					tags.unshift({
						type: 'female',
						name: 'yandere'
					});

					filterPromises.unshift(new Promise<Set<number>>(function (resolve: (value: Set<number> | PromiseLike<Set<number>>) => void, reject: (reason?: any) => void): void {
						getIds({ startIndex: 0 }).then(function (ids: number[]): void | PromiseLike<void> {
							resolve(new Set<number>(ids));

							return;
						})
						.catch(reject);

						return;
					}));
				}

				filterPromises.reduce(function (previousPromise: Promise<Set<number>>, currentPromise: Promise<Set<number>>, currentIndex: number, array: Promise<Set<number>>[]): Promise<Set<number>> {
					return previousPromise.then(function (_idSet: Set<number>): Promise<Set<number>> {
						const fixedCurrentIndex: number = currentIndex - 1;

						if(fixedCurrentIndex === 0) {
							idSet = _idSet;
						} else {
							const isPreviousTagNegative: boolean = tags[fixedCurrentIndex]['isNegative'] ?? false;

							idSet.forEach(function (id: number, id2: number, set: Set<number>): void {
								if(isPreviousTagNegative === _idSet.has(id)/* !(isPreviousTagNegative ^ _idSet.has(id)) */) {
									idSet.delete(id);
								}
							});
						}

						return currentPromise;
					});
				})
				.then(function (_idSet: Set<number>): void | PromiseLike<void> {
					resolve(Array.from(idSet));

					return;
				})
				.catch(reject);

				return;
			}
		});
	}

	export function getTags(type: TagType, option?: { startWith?: StartingCharacter }): Promise<Tag[]> {
		return new Promise<Tag[]>(function (resolve: (value: Tag[] | PromiseLike<Tag[]>) => void, reject: (reason?: any) => void): void {
			if(type !== 'language' && type !== 'type' && typeof(option?.['startWith']) === 'undefined' || (type === 'language' || type === 'type') && typeof(option?.['startWith']) !== 'undefined') {
				reject(new HitomiError('INVALID_VALUE', 'startingCharacter'));

				return;
			} else {
				if(type === 'type') {
					resolve([
						{
							type: 'type',
							name: 'doujinshi'
						},
						{
							type: 'type',
							name: 'manga'
						},
						{
							type: 'type',
							name: 'artistcg'
						},
						{
							type: 'type',
							name: 'gamecg'
						},
						{
							type: 'type',
							name: 'anime'
						},
					]);
				} else {
					// @ts-expect-error :: Already checked availability of startingCharacter
					const startingCharacter: StartingCharacter = option['startWith'];

					fetchBuffer(getTagUrl(type, { startWith: startingCharacter })).then(function (buffer: Buffer): void | PromiseLike<void> {
						let nameMatchRegularExpressionString: string = '';

						if(type === 'language') {
							nameMatchRegularExpressionString = '(?<=")(?!all)[a-z]+(?=":)';
						} else {
							nameMatchRegularExpressionString = '(?<=\/tag\/' + (type === 'male' || type === 'female' ? type + '%3A' : '') + ')[a-z0-9%]+(?=-all\\.html)';
						}

						const matchedNames: string[] = buffer.toString('utf8')
						.match(RegExp(nameMatchRegularExpressionString, 'g')) || [];
						const nameValidateRegularExpression: RegExp = RegExp('^(?=[' + startingCharacter + '])[a-z0-9%]+$');
						let tags: Tag[] = [];

						for(let i: number = 0; i < matchedNames['length']; i++) {
							const name: string = decodeURIComponent(matchedNames[i]);

							if(nameValidateRegularExpression.test(matchedNames[i])) {
								tags.push({
									type: type,
									name: name
								});
							}
						}

						resolve(tags);

						return;
					})
					.catch(reject);
				}
				
				return;
			}
		});
	}
}

export default hitomi;
