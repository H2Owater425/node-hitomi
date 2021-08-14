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
		artistList: string[];
		groupList: string[];
		seriesList: string[];
		characterList: string[];
		tagList: Tag[];
		fileList: Image[];
		publishedDate: Date;
	}
	
	export type OrderCriteria = 'index' | 'popularity';
	
	export type StartingCharacter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | '0-9';
	
	export interface LooseObject {
		[key: string]: any;
	}

	// utility
	
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
	
	function getArrayBuffer(buffer: Buffer): ArrayBuffer {
		let arrayBuffer: ArrayBuffer = new ArrayBuffer(buffer.byteLength);
		let unit8Array: Uint8Array = new Uint8Array(arrayBuffer);
	
		for (let i: number = 0; i < buffer.byteLength; ++i) {
			unit8Array[i] = buffer[i];
		}
	
		return arrayBuffer;
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
				let bufferList: Buffer[] = [];
				let bufferLength: number = 0;
	
				response.on('data', function (chunk: any): void {
					bufferList.push(chunk);
					bufferLength += chunk.byteLength;
	
					return;
				});
	
				response.on('error', function (error: Error): void {
					reject(error);
	
					return;
				});
	
				response.on('end', function (): void {
					resolve(Buffer.concat(bufferList, bufferLength));
	
					return;
				});
	
				return;
			})
			.on('error', reject)
			.end();
	
			return;
		});
	}

	// url resolver

	export function getImageUrl(image: Image, extension: 'jpg' | 'png' | 'avif' | 'webp', option?: { isThumbnail?: boolean; }): string {
		const isThumbnail: boolean = typeof(option) !== 'undefined' && typeof(option['isThumbnail']) !== 'undefined' ? option['isThumbnail'] : false;
	
		switch(extension) {
			case 'jpg':
				if(!isThumbnail && image['extension'] !== 'jpg') {
					throw new Error('Invalid extension');
				} else {
					break;
				}
			case 'png':
				if(image['extension'] !== 'png') {
					throw new Error('Invalid extension');
				} else if(isThumbnail) {
					throw new Error('Invalid extension for thumbnail');
				} else {
					break;
				}
			case 'avif':
				if(!image['hasAvif']) {
					throw new Error('Invalid extension');
				} else {
					break;
				}
			case 'webp':
				if(!image['hasWebp']) {
					throw new Error('Invalid extension');
				} else if(isThumbnail) {
					throw new Error('Invalid extension for thumbnail');
				} else {
					break;
				}
		}
	
		if(!/^[0-9a-f]{64}$/.test(image['hash'])) {
			throw new Error('Invalid hash value');
		} else if(!isInteger(image['index']) || image['index'] < 0) {
			throw new Error('Invalid image index');
		} else if(isThumbnail && image['index'] !== 0) {
			throw new Error('Invalid index for thumbnail');
		} else {
			const imagePath: string = `${image['hash'].slice(-1)}/${image['hash'].slice(-3, -1)}/${image['hash']}`;
			let subdomain: string = '';
			let folderName: string = '';
	
			if(!isThumbnail) {
				//let frontendCount: number = 3; Not used anymore
				let hexadecimalId: number = Number.parseInt(image['hash'].slice(-3, -1), 16);
	
				let temporaryNumber: number = 0;
	
				if(hexadecimalId < 64/* = 0x40 */) {
					temporaryNumber = 2
				} else if(hexadecimalId < 128/* = 0x80 */) {
					temporaryNumber = 1
				}
		
				subdomain = `${String.fromCharCode(temporaryNumber + 97)}`;
		
				if(extension === 'jpg' || extension === 'png') {
					subdomain += 'b';
					folderName = 'images';
				} else {
					subdomain += 'a';
					folderName = `${extension}`;
				}
			} else {
				subdomain = 'tn';
		
				if(extension === 'jpg' || extension === 'png') {
					folderName = 'bigtn';
				} else {
					folderName = 'avifbigtn';
				}
			}
		
			return `https://${subdomain}.hitomi.la/${folderName}/${imagePath}.${extension}`;
		}
	}

	export function getVideoUrl(gallery: Gallery): string {
		return `https://streaming.hitomi.la/videos/${gallery['title']['display'].toLowerCase().replace(/\s/g, '-')}.mp4`;
	}
	
	export function getGalleryUrl(gallery: Gallery): string {
		return `https://hitomi.la/${gallery['type']}/${encodeURIComponent(gallery['title']['japanese'] !== null ? gallery['title']['japanese'] : gallery['title']['display']).replace(/\(|\)|'|%(2(0|2|3|5|F)|3(C|E|F)|5(B|D)|7(B|D))/g, '-')}${gallery['languageName']['local'] !== null ? `-${encodeURIComponent(gallery['languageName']['local'])}` : ''}-${gallery['id']}.html`.toLocaleLowerCase();
	}
	
	export function getNozomiUrl(tag: Tag, option?: { orderBy?: OrderCriteria }): string {
		if(tag['type'] !== 'language' && typeof(option) !== 'undefined' && typeof(option['orderBy'])) {
			throw new Error(`Invalid order criteria for ${tag['type']} tag type`);
		} else {
			const orderBy: OrderCriteria = typeof(option) !== 'undefined' && typeof(option['orderBy']) !== 'undefined' ? option['orderBy'] : 'index';
	
			let area: string = '';
			let tagString: string = '';
			let language: string = 'all';
	
			switch(tag['type']) {
				case 'male':
				case 'female':
					area = 'tag/';
					tagString = `${tag['type']}:${tag['name'].replace(/_/g, ' ')}`;
	
					break;
				case 'language':
					tagString = orderBy;
					language = tag['name'];
	
					break;
				default:
					area = `${tag['type']}/`;
					tagString = tag['name'].replace(/_/g, ' ');
	
					break;
			}
	
			return `https://ltn.hitomi.la/n/${area}${tagString}-${language}.nozomi`;
		}
	}
	
	export function getTagUrl(type: TagType, option: { startWith: StartingCharacter }): string {
		const startingCharacter: StartingCharacter = option['startWith'];
		let url: string = '';
	
		switch(type) {
			case 'tag':
			case 'male':
			case 'female':
				url = 'https://hitomi.la/alltags-';
	
				break;
			case 'artist':
				url = 'https://hitomi.la/allartists-';
	
				break;
			case 'series':
				url = 'https://hitomi.la/allseries-';
				
				break;
			case 'character':
				url = 'https://hitomi.la/allcharacters-';
	
				break;
			case 'group':
				url = 'https://hitomi.la/allgroups-';
	
				break;
			case 'language':
				url = 'https://ltn.hitomi.la/language_support.js';
	
				break;
		}
	
		if(type === 'language') {
			return url;
		} else if(type === 'male') {
			return `${url}m.html`;
		} else if(type === 'female') {
			return `${url}f.html`;
		} else {
			return `${url}${startingCharacter !== '0-9' ? startingCharacter : '123'}.html`;
		}
	}

	// gallery

	export function getGallery(id: number, option?: { includeFullData?: boolean; includeFiles?: boolean; }): Promise<Gallery> {
		if(!isInteger(id) || (isInteger(id) && id < 1)) {
			throw new Error('Invalid id value');
		} else {
			const includeFiles: boolean = typeof(option) !== 'undefined' && typeof(option['includeFiles']) !== 'undefined' ? option['includeFiles'] : true;
			const includeFullData: boolean = typeof(option) !== 'undefined' && typeof(option['includeFullData']) !== 'undefined' ? option['includeFullData'] : true;
		
			return new Promise<Gallery>(function (resolve: (value: Gallery | PromiseLike<Gallery>) => void, reject: (reason?: any) => void): void {
				fetchBuffer(`https://ltn.hitomi.la/galleries/${id}.js`)
				.then(function (buffer: Buffer): void | PromiseLike<void> {
					const responseJson: LooseObject = JSON.parse(buffer.toString('utf8').slice(18));
	
					let galleryData: Gallery = {
						id: responseJson['id'],
						title: {
							display: responseJson['title'],
							japanese: responseJson['japanese_title']
						},
						type: responseJson['type'],
						languageName: {
							english: responseJson['language'],
							local: responseJson['language_localname']
						},
						artistList: [],
						groupList: [],
						seriesList: [],
						characterList: [],
						tagList: [],
						fileList: [],
						publishedDate: new Date(`${responseJson['date']}:00`.replace(' ', 'T'))
					}
	
					if(responseJson['tags'] !== null) {
						for(let i: number = 0; i < responseJson['tags'].length; i++) {
							let type: Tag['type'] = 'tag';
		
							if(Boolean(responseJson['tags'][i]['male'])) {
								type = 'male';
							} else if(Boolean(responseJson['tags'][i]['female'])) {
								type = 'female';
							}
		
							galleryData['tagList'].push({
								name: responseJson['tags'][i]['tag'],
								type: type
							});
						}
					}
	
					if(includeFiles) {
						for(let i: number = 0; i < responseJson['files'].length; i++) {
							galleryData['fileList'].push({
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
	
					if(includeFullData) {
						fetchBuffer(getGalleryUrl(galleryData))
						.then(function (_buffer: Buffer): void | PromiseLike<void> {
							const galleryContentHtml: string = _buffer.toString('utf8').split('content">')[1];
	
							if(typeof(galleryContentHtml) !== 'undefined') {
								['artist', 'group', 'series', 'character'].forEach(function (tag: string, index: number, array: string[]): void {
									galleryContentHtml.match(RegExp(`(?<=\/${tag}\/)[a-z0-9%]+(?=-all\\.html)`, 'g'))
									// @ts-expect-error :: Since using combination of string as key, typescript detects error. But still, works fine!
									?.forEach((matchedString: string, index: number, array: string[]) => galleryData[`${tag}List`].push(decodeURIComponent(matchedString)));
								});
							}
	
							resolve(galleryData);
	
							return;
						})
						.catch(reject);
					} else {
						resolve(galleryData);
	
						return;
					}
				})
				.catch(reject);
			});
		}
	}
	
	export function getIdList(range: { startIndex: number; endIndex?: number; }, option?: { orderBy?: OrderCriteria, reverseResult?: boolean; }): Promise<number[]> {
		return new Promise<number[]>(function (resolve: (value: number[] | PromiseLike<number[]>) => void, reject: (reason: any) => void) {
			if(!isInteger(range['startIndex']) || (isInteger(range['startIndex']) && range['startIndex'] < 0)) {
				reject(new Error('Invalid startIndex value'));
				
				return;
			} else if(typeof(range['endIndex']) !== 'undefined' && (!isInteger(range['endIndex']) || (isInteger(range['endIndex']) && range['endIndex'] <= range['startIndex']))) {
				reject(new Error('Invalid endIndex value'));
				
				return;
			} else {
				const startByte: number = range['startIndex'] * 4;
				const endByte: number | string = typeof(range['endIndex']) !== 'undefined' ? startByte + (range['endIndex'] + 1) * 4 - 1 : '';
				const orderBy: OrderCriteria = typeof(option) !== 'undefined' && typeof(option['orderBy']) !== 'undefined' ? option['orderBy'] : 'index';
				const reverseResult: boolean = typeof(option) !== 'undefined' && typeof(option['reverseResult']) !== 'undefined' ? option['reverseResult'] : false;
	
				fetchBuffer(`https://ltn.hitomi.la/${orderBy}-all.nozomi`, { Range: `bytes=${startByte}-${endByte}` })
				.then(function (buffer: Buffer): void | PromiseLike<void> {
					const arrayBuffer: ArrayBuffer = getArrayBuffer(buffer);
					const dataView: DataView = new DataView(arrayBuffer);
					const totalLength: number = dataView.byteLength / 4;
				
					let galleryIdList: number[] = [];
					
					if(reverseResult) {
						for(let i: number = 0; i < totalLength; i++) {
							galleryIdList.push(dataView.getInt32(i * 4, false));
						}
					}	else {
						for(let i: number = totalLength - 1; i !== -1; i--) {
							galleryIdList.push(dataView.getInt32(i * 4, false));
						}
					}
	
					resolve(galleryIdList);
	
					return;
				})
				.catch(reject);
			}
		});
	}

	// tag

	export function getParsedTagList(tagString: string): Tag[] {
		const tagStringList: string[] = tagString.split(' ');
	
		if(tagStringList.length < 1) {
			throw new Error('Lack of tag');
		} else {
			let tagList: Tag[] = [];
			let positiveTagStringList: string[] = [];
	
			for(let i: number = 0; i < tagStringList.length; i++) {
				const splitedTagWithoutMinus: string[] = tagStringList[i].replace(/^-/, '').split(':');
		
				if(splitedTagWithoutMinus.length !== 2 || typeof(splitedTagWithoutMinus[0]) === 'undefined' || typeof(splitedTagWithoutMinus[1]) === 'undefined' || splitedTagWithoutMinus[0] === '' || splitedTagWithoutMinus[1] === '' || !/^(artist|group|type|language|series|tag|male|female)$/.test(splitedTagWithoutMinus[0]) || !/^[^-_\.][a-z0-9-_.]+$/.test(splitedTagWithoutMinus[1])) {
					throw new Error('Invalid tag');
				} else {
					const _tagString: string = `${splitedTagWithoutMinus[0]}:${splitedTagWithoutMinus[1]}`;
	
					if(positiveTagStringList.includes(_tagString)) {
						throw new Error('Duplicated tag');
					} else {
						tagList.push({
							// @ts-expect-error :: Since type element of Tag in node-hitomi is based on hitomi tag, parsing it will return corresponding type value
							type: splitedTagWithoutMinus[0],
							name: splitedTagWithoutMinus[1],
							isNegative: tagStringList[i].startsWith('-')
						});
	
						positiveTagStringList.push(_tagString);
					}
				}
			}
	
			return tagList;
		}
	}
	
	export function getQueriedIdList(tagList: Tag[]): Promise<number[]> {
		return new Promise<number[]>(function (resolve: (value: number[] | PromiseLike<number[]>) => void, reject: (reason?: any) => void): void {
			if(tagList.length < 1) {
				throw new Error('Lack of tag');
			} else {
				tagList.sort(function (a: Tag, b: Tag): number {
					const [isANegative, isBNegative]: boolean[] = [typeof(a['isNegative']) !== 'undefined' ? a['isNegative'] : false, typeof(b['isNegative']) !== 'undefined' ? b['isNegative'] : false]
	
					if(!isANegative && !isBNegative){
						return 0;
					} else if(!isANegative) {
						return -1;
					} else {
						return 1;
					}
				});
	
				let idSet: Set<number> = new Set<number>();
	
				let filterPromiseList: Promise<Set<number>>[] = tagList.map(function (tag: Tag, index: number, array: Tag[]): Promise<Set<number>> {
					return new Promise<Set<number>>(function (resolve: (value: Set<number> | PromiseLike<Set<number>>) => void, reject: (reason?: any) => void): void {
						fetchBuffer(getNozomiUrl(tag))
						.then(function (buffer: Buffer): void | PromiseLike<void> {
							const arrayBuffer: ArrayBuffer = getArrayBuffer(buffer);
							const dataView: DataView = new DataView(arrayBuffer);
							const dividedDataviewLength: number = dataView.byteLength / 4;
	
							let _idSet: Set<number> = new Set<number>();
	
							for(let i = 0; i < dividedDataviewLength; i++) {
								_idSet.add(dataView.getInt32(i * 4, false));
							}
	
							resolve(_idSet);
	
							return;
						})
						.catch(reject);
	
						return;
					});
				});
	
				filterPromiseList.push(new Promise<Set<number>>(function (resolve: (value: Set<number> | PromiseLike<Set<number>>) => void, reject: (reason?: any) => void): void {
					resolve(new Set<number>());
				}));
	
				if(typeof(tagList[0]['isNegative']) !== 'undefined' ? tagList[0]['isNegative'] : false) {
					// Not affecting result, but to run properly it is needed to unshift one tag.
					tagList.unshift({
						type: 'female',
						name: 'yandere'
					});
	
					filterPromiseList.unshift(new Promise<Set<number>>(function (resolve: (value: Set<number> | PromiseLike<Set<number>>) => void, reject: (reason?: any) => void): void {
						getIdList({ startIndex: 0 })
						.then(function (idList: number[]): void {
							resolve(new Set<number>(idList));
	
							return;
						})
						.catch(reject);
	
						return;
					}));
				}
	
				filterPromiseList.reduce(function (previousPromise: Promise<Set<number>>, currentPromise: Promise<Set<number>>, currentIndex: number, array: Promise<Set<number>>[]): Promise<Set<number>> {
					return previousPromise
					.then(function (_idSet: Set<number>): Promise<Set<number>> {
						const fixedCurrentIndex: number = currentIndex - 1;
	
						if(fixedCurrentIndex === 0) {
							idSet = _idSet;
						} else {
							// @ts-expect-error :: Typescript's fault
							const isPreviousTagNegative: boolean = typeof(tagList[fixedCurrentIndex]['isNegative']) !== 'undefined' ? tagList[fixedCurrentIndex]['isNegative'] : false;
							
							idSet.forEach(function (id: number, id2: number, set: Set<number>): void {
								if(isPreviousTagNegative === _idSet.has(id)/* !(isPreviousTagNegative ^ _idSet.has(id)) */) {
									idSet.delete(id);
								}
							});
						}
	
						return currentPromise;
					})
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
	
	export function getTagList(type: TagType, option?: { startWith?: StartingCharacter }): Promise<Tag[]> {
		return new Promise<Tag[]>(function (resolve: (value: Tag[] | PromiseLike<Tag[]>) => void, reject: (reason?: any) => void): void {
			if(type !== 'language' && type !== 'type' && (typeof(option) === 'undefined' || typeof(option['startWith']) === 'undefined') || (type === 'language' || type === 'type') && typeof(option) !== 'undefined' && typeof(option['startWith']) !== 'undefined') {
				reject(new Error('Invalid startingCharacter'));
				
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

					fetchBuffer(getTagUrl(type, { startWith: startingCharacter }))
					.then(function (buffer: Buffer): void | PromiseLike<void> {
						let nameMatchRegularExpressionString: string = '';
		
						if(type === 'language') {
							nameMatchRegularExpressionString = '(?<=")(?!all)[a-z]+(?=":)';
						} else {
							nameMatchRegularExpressionString = `(?<=\/tag\/${type === 'male' || type === 'female' ? type + '%3A' : ''})[a-z0-9%]+(?=-all\\.html)`;
						}
	
						const matchedNameList: string[] = buffer.toString('utf8').match(RegExp(nameMatchRegularExpressionString, 'g')) || [];
						const nameValidateRegularExpression: RegExp = RegExp(`^(?=[${startingCharacter}])[a-z0-9%]+$`);
						let tagList: Tag[] = [];
	
						for(let i: number = 0; i < matchedNameList.length; i++) {
							const name: string = decodeURIComponent(matchedNameList[i]);
							
							if(matchedNameList[i].match(nameValidateRegularExpression) !== null) {
								tagList.push({
									type: type,
									name: name
								});
							}
						}
	
						resolve(tagList);
		
						return;
					})
					.catch(reject);
				}
			}
		});
	}
}

export default hitomi;