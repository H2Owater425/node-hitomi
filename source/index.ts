import { IncomingMessage } from 'http';
import { request, Agent, AgentOptions } from 'https';
import { connect, TLSSocket } from 'tls';

module hitomi {
	// type definition

	export interface Image {
		index: number;
		hash: string;
		extension: 'jpg' | 'png';
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
			}).end();
	
			return;
		});
	}

	// url resolver

	export function getImageUrl(imageData: Image, extension: 'jpg' | 'png' | 'avif' | 'webp', option?: { isThumbnail?: boolean; }): string {
		const isThumbnail: boolean = typeof(option) !== 'undefined' && typeof(option['isThumbnail']) !== 'undefined' ? option['isThumbnail'] : false;
	
		switch(extension) {
			case 'jpg':
				if(!isThumbnail && imageData['extension'] !== 'jpg') {
					throw Error('Invalid extension');
				} else {
					break;
				}
			case 'png':
				if(imageData['extension'] !== 'png') {
					throw Error('Invalid extension');
				} else if(isThumbnail) {
					throw Error('Invalid extension for thumbnail');
				} else {
					break;
				}
			case 'avif':
				if(!imageData['hasAvif']) {
					throw Error('Invalid extension');
				} else {
					break;
				}
			case 'webp':
				if(!imageData['hasWebp']) {
					throw Error('Invalid extension');
				} else if(isThumbnail) {
					throw Error('Invalid extension for thumbnail');
				} else {
					break;
				}
		}
	
		if(!/^[0-9a-f]{64}$/.test(imageData['hash'])) {
			throw Error('Invalid hash value');
		} else if(!isInteger(imageData['index']) || imageData['index'] < 0) {
			throw Error('Invalid image index');
		} else if(isThumbnail && imageData['index'] !== 0) {
			throw Error('Invalid index for thumbnail');
		} else {
			const imagePath: string = `${imageData['hash'].slice(-1)}/${imageData['hash'].slice(-3, -1)}/${imageData['hash']}`;
			let subdomain: string = '';
			let folderName: string = '';
	
			if(!isThumbnail) {
				//let frontendCount: number = 3; Not used anymore
				let hexadecimalId: number = Number.parseInt(imageData['hash'].slice(-3, -1), 16);
	
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
	
	export function getGalleryUrl(galleryData: Gallery): string {
		const title: string = encodeURIComponent(galleryData['title']['japanese'] !== null ? galleryData['title']['japanese'] : galleryData['title']['display']).replace(/\(|\)|'|%(2(0|2|3|5|F)|3(C|E|F)|5(B|D)|7(B|D))/g, '-');
		const language: string = galleryData['languageName']['local'] !== null ? `-${encodeURIComponent(galleryData['languageName']['local'])}` : '';
	
		return `https://hitomi.la/${galleryData['type']}/${title}${language}-${galleryData['id']}.html`.toLocaleLowerCase();
	}
	
	export function getNozomiUrl(tag: Tag, option?: { orderBy?: OrderCriteria }): string {
		if(tag['type'] !== 'language' && typeof(option) !== 'undefined' && typeof(option['orderBy'])) {
			throw Error(`Invalid order criteria for ${tag['type']} tag type`);
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
	
	export function getTagUrl(type: TagType, startingCharacter?: StartingCharacter): string {
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

	export function getGalleryData(id: number, option?: { includeFullData?: boolean; includeFiles?: boolean; }): Promise<Gallery> {
		if(!isInteger(id) || (isInteger(id) && id < 1)) {
			throw Error('Invalid id value');
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
								['artist', 'group', 'series', 'character'].forEach(function (value: string, index: number, array: string[]): void {
									galleryContentHtml.match(RegExp(`(?<=\/${value}\/)[a-z0-9%]+(?=-all\\.html)`, 'g'))
									// @ts-expect-error :: Since using combination of string as key, typescript detects error. But still, works fine!
									?.forEach((_value: string, index: number, array: string[]) => galleryData[`${value}List`].push(decodeURIComponent(_value)));
								});
							}
	
							resolve(galleryData);
	
							return;
						});
					} else {
						resolve(galleryData);
	
						return;
					}
				});
			});
		}
	}
	
	export function getGalleryIdList(range: { startIndex: number; endIndex?: number; }, option?: { orderBy?: OrderCriteria, reverseResult?: boolean; }): Promise<number[]> {
		if(!isInteger(range['startIndex']) || (isInteger(range['startIndex']) && range['startIndex'] < 0)) {
			throw Error('Invalid startIndex value');
		} else if(typeof(range['endIndex']) !== 'undefined' && (!isInteger(range['endIndex']) || (isInteger(range['endIndex']) && range['endIndex'] <= range['startIndex']))) {
			throw Error('Invalid endIndex value');
		} else {
			return new Promise<number[]>(function (resolve: (value: number[] | PromiseLike<number[]>) => void, reject: (reason: any) => void) {
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
				});
			});
		}
	}

	// tag

	export function parseTag(tagString: string): Tag[] {
		const tagStringList: string[] = tagString.split(' ');
	
		if(tagStringList.length < 1) {
			throw Error('Lack of tag');
		} else {
			let positiveTagStringList: string[] = [...tagStringList].map(function (value: string, index: number, array: string[]): string {
				const splitedTag: string[] = value.replace(/^-/, '').split(':');
				const [type, name]: string[] = [...splitedTag];
		
				if(splitedTag.length !== 2 || typeof(type) === 'undefined' || typeof(name) === 'undefined' || type === '' || name === '' || !/^(artist|group|type|language|series|tag|male|female)$/.test(type) || !/^[^-_\.][a-z0-9-_.]+$/.test(name)) {
					throw Error('Invalid tag');
				} else {
					return `${type}:${name}`;
				}
			});
		
			for(let i: number = 0; i < positiveTagStringList.length; i++) {
				const name: string = positiveTagStringList[i];
				positiveTagStringList.splice(i, 1);
		
				if(positiveTagStringList.indexOf(name) !== -1) {
					throw Error('Duplicated tag');
				} else {
					continue;
				}
			}
		
			let tagList: Tag[] = [];
		
			for(let i: number = 0; i < tagStringList.length; i++) {
				const [type, name]: string[] = tagStringList[i].replace(/^-/, '').split(':');
		
				tagList.push({
					// @ts-expect-error :: Since type element of Tag in node-hitomi is based on hitomi tag, parsing it will return corresponding type value
					type: type,
					name: name,
					isNegative: tagStringList[i].startsWith('-')
				});
			}
		
			return tagList;
		}
	}
	
	export function queryTag(tagList: Tag[]): Promise<number[]> {
		return new Promise<number[]>(function (resolve: (value: number[] | PromiseLike<number[]>) => void, reject: (reason?: any) => void): void {
			if(tagList.length < 1) {
				throw Error('Lack of tag');
			} else {
				let [positiveTagList, negativeTagList]: Tag[][] = [[], []];
			
				for(let i: number = 0; i < tagList.length; i++) {
					switch(typeof(tagList[i]['isNegative']) !== 'undefined' ? tagList[i]['isNegative'] : false) {
						case false:
							positiveTagList.push(tagList[i]);
		
							break;
						case true:
							negativeTagList.push(tagList[i]);
		
							break;
					}
				}
			
				new Promise<number[]>(function (resolve: (value: number[] | PromiseLike<number[]>) => void, reject: (reason?: any) => void): void {
					if(positiveTagList.length === 0) {
						getGalleryIdList({ startIndex: 0 })
						.then((value: number[]) => resolve(value));
		
						return;
					} else {
						resolve([]);
		
						return;
					}
				})
				.then(async function (value: number[]): Promise<void> {
					let idList: number[] = value;
		
					for(let i: number = 0; i < positiveTagList.length; i++) {
						await fetchBuffer(getNozomiUrl(positiveTagList[i]))
						.then(function (buffer: Buffer): void | PromiseLike<void> {
							const arrayBuffer: ArrayBuffer = getArrayBuffer(buffer);
							const dataView: DataView = new DataView(arrayBuffer);
							const totalLength: number = dataView.byteLength / 4;
		
							let queryIdList: number[] = [];
		
							for(let j = 0; j < totalLength; j++) {
								queryIdList.push(dataView.getInt32(j * 4, false));
							}
		
							let settedQueryIdList: Set<number> = new Set(queryIdList);
							
							if(i !== 0) {
								idList = idList.filter(function (value: number, index: number, array: number[]): boolean {
									if(settedQueryIdList.has(value)) {
										return true;
									} else {
										return false;
									}
								});
							} else {
								idList = [...queryIdList];
							}
		
							return;
						});
					}
		
					for(let i: number = 0; i < negativeTagList.length; i++) {
						await fetchBuffer(getNozomiUrl(negativeTagList[i]))
						.then(function (buffer: Buffer): void | PromiseLike<void> {
							const arrayBuffer: ArrayBuffer = getArrayBuffer(buffer);
							const dataView: DataView = new DataView(arrayBuffer);
							const totalLength: number = dataView.byteLength / 4;
		
							let queryIdList: number[] = [];
		
							for(let j = 0; j < totalLength; j++) {
								queryIdList.push(dataView.getInt32(j * 4, false));
							}
		
							let settedQueryIdList: Set<number> = new Set(queryIdList);
		
							idList = idList.filter(function (value: number, index: number, array: number[]): boolean {
								if(!settedQueryIdList.has(value)) {
									return true;
								} else {
									return false;
								}
							});
		
							return;
						});
					}
		
					resolve(idList);
		
					return;
				});
			}
		});
	}
	
	export function getTagList(type: TagType, startingCharacter?: StartingCharacter): Promise<Tag[]> {
		return new Promise<Tag[]>(function (resolve: (value: Tag[] | PromiseLike<Tag[]>) => void, reject: (reason?: any) => void): void {
			if(type !== 'language' && type !== 'type' && typeof(startingCharacter) === 'undefined' || (type === 'language' || type === 'type') && typeof(startingCharacter) !== 'undefined') {
				throw Error('Invalid startingCharacter');
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
					fetchBuffer(getTagUrl(type, startingCharacter))
					.then(function (buffer: Buffer): void | PromiseLike<void> {
						let nameMatchRegularExpressionString: string = '';
		
						if(type === 'language') {
							nameMatchRegularExpressionString = '(?<=")(?!all)[a-z]+(?=":)';
						} else {
							nameMatchRegularExpressionString = `(?<=\/tag\/${type === 'male' || type === 'female' ? type + '%3A' : ''})[a-z0-9%]+(?=-all\\.html)`;
						}
	
						const mattchedNameList: string[] = buffer.toString('utf8').match(RegExp(nameMatchRegularExpressionString, 'g')) || [];
						const nameValidateRegularExpression: RegExp = RegExp(`^(?=[${startingCharacter}])[a-z0-9%]+$`);
						let tagList: Tag[] = [];
	
						for(let i: number = 0; i < mattchedNameList.length; i++) {
							const name: string = decodeURIComponent(mattchedNameList[i]);
							
							if(mattchedNameList[i].match(nameValidateRegularExpression) !== null) {
								tagList.push({
									type: type,
									name: name
								});
							}
						}
	
						resolve(tagList);
		
						return;
					});
				}
			}
		});
	}
}

export default hitomi;