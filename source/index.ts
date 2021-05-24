import https from 'https';
import tls from 'tls';
import fetch, { RequestInit, Response } from 'node-fetch';

interface LooseObject {
	[key: string]: any;
}

interface PageRange {
	startPage: number;
	endPage?: number;
}

interface Image {
	index: number;
	hash: string;
	extension: 'jpg' | 'png';
	hasAvif: boolean;
	hasWebp: boolean;
	width: number;
	height: number;
}

interface Tag {
	type: 'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag';
	name: string;
	isNegative?: boolean;
}

interface Gallery {
	id: number;
	title: string;
	titleJapanese: string | null;
	type: 'doujinshi' | 'manga' | 'artistcg' | 'gamecg';
	language: string | null;
	languageLocalName: string | null;
	artists: string[];
	groups: string[];
	series: string[];
	characters: string[];
	tags: Tag[];
	files: Image[] | null;
	publishedDate: Date;
}

Number.isInteger = function (value: any): boolean {
	if(Number.parseInt(value) === Number(value) && Number.isFinite(value) && typeof(value) !== 'object') {
		return true;
	} else {
		return false;
	}
}

class Agent extends https.Agent {
	public createConnection(options: https.AgentOptions, callback?: () => void): tls.TLSSocket {
		options['servername'] = undefined;
		return tls.connect(options, callback);
	}
}

const requestOption: RequestInit = {
	method: 'GET',
	agent: new Agent({ rejectUnauthorized: false, keepAlive: true }),
	headers: {
		'Accept': '*/*',
		'Accept-Encoding': 'gzip, deflate, br',
		'Connection': 'keep-alive'
	}
}

export function getImageUrl(imageData: Image, extension: 'jpg' | 'png' | 'avif' | 'webp', option?: { isThumbnail: boolean; }): string {
	const isThumbnail: boolean = typeof(option) !== 'undefined' ? option['isThumbnail'] : false;

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
	} else if(!Number.isInteger(imageData['index']) || imageData['index'] < 0) {
		throw Error('Invalid image index');
	} else if(isThumbnail && imageData['index'] !== 0) {
		throw Error('Invalid index for thumbnail');
	}

	const imagePath: string = `${imageData['hash'].slice(-1)}/${imageData['hash'].slice(-3, -1)}/${imageData['hash']}`;
	let subdomain: string;
	let folderName: string;

	if(!isThumbnail) {
		let frontendCount: number = 3;
		let hexadecimalId: number = Number.parseInt(imageData['hash'].slice(-3, -1), 16);

		if(hexadecimalId < 48) {
			frontendCount = 2
		}

		if(hexadecimalId < 9) {
			hexadecimalId = 1
		}

		subdomain = `${String.fromCharCode(hexadecimalId % frontendCount + 97)}`;

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

export function getGalleryUrl(galleryData: Gallery): string {
	const title: string = encodeURIComponent(galleryData['titleJapanese'] !== null ? galleryData['titleJapanese'] : galleryData['title']).replace(/\(|\)|'|%(2(0|2|3|5|F)|3(C|E|F)|5(B|D)|7(B|D))/g, '-');
	const language: string = galleryData['languageLocalName'] !== null ? `-${encodeURIComponent(galleryData['languageLocalName'])}` : '';

	return `https://hitomi.la/${galleryData['type']}/${title}${language}-${galleryData['id']}.html`.toLocaleLowerCase();
}

export function getNozomiUrl(tag: Tag): string {
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
			tagString = 'index';
			language = tag['name'];

			break;
		default:
			area = `${tag['type']}/`;
			tagString = tag['name'].replace(/_/g, ' ');

			break;
	}

	return `https://ltn.hitomi.la/n/${area}${tagString}-${language}.nozomi`;
}

export function getGalleryData(id: number, option?: { includeFiles: boolean; }): Promise<Gallery> {
	if(!Number.isInteger(id) || (Number.isInteger(id) && id < 1)) {
		throw Error('Invalid id value');
	}

	const includeFiles: boolean = typeof(option) !== 'undefined' ? option['includeFiles'] : true;

	return new Promise<Gallery>(function (resolve: (value: Gallery | PromiseLike<Gallery>) => void, reject: (reason?: any) => void): void {
		try {
			fetch(`https://ltn.hitomi.la/galleries/${id}.js`, requestOption)
			.then(function (response: Response): string | PromiseLike<string> {
				return response.text();
			})
			.then(function (responseText: string): void | PromiseLike<void> {
				const responseJson: LooseObject = JSON.parse(responseText.slice(18));

				let galleryData: Gallery = {
					id: responseJson['id'],
					title: responseJson['title'],
					titleJapanese: responseJson['japanese_title'],
					type: responseJson['type'],
					language: responseJson['language'],
					languageLocalName: responseJson['language_localname'],
					artists: [],
					groups: [],
					series: [],
					characters: [],
					tags: [],
					files: null,
					publishedDate: new Date(`${responseJson['date']}:00`.replace(' ', 'T'))
				}

				for(let i = 0; i < responseJson['tags'].length; i++) {
					let type: Tag['type'] = 'tag';

					if(Boolean(responseJson['tags'][i]['male'])) {
						type = 'male';
					} else if(Boolean(responseJson['tags'][i]['female'])) {
						type = 'female';
					}

					galleryData['tags'].push({
						name: responseJson['tags'][i]['tag'],
						type: type
					});
				}

				if(includeFiles) {
					galleryData['files'] = [];

					for(let i = 0; i < responseJson['files'].length; i++) {
						galleryData['files'].push({
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

				fetch(getGalleryUrl(galleryData), requestOption)
				.then(function (_response: Response): string | PromiseLike<string> {
					return _response.text()
				})
				.then(function (_responseText: string): void | PromiseLike<void> {
					const galleryContentHtml: string = _responseText.split('content">')[1];

					if(typeof(galleryContentHtml) === 'undefined') {
						resolve(galleryData);
						return;
					} else {
						galleryContentHtml.match(/(?<=\/artist\/)[a-z0-9%]+(?=-all\.html)/g)
						?.map(function (value: string, index: number, array: string[]): void {
							if(galleryData['artists'] === null) {
								galleryData['artists'] = [];
							}

							galleryData['artists'].push(decodeURIComponent(value));
						});

						galleryContentHtml.match(/(?<=\/group\/)[a-z0-9%]+(?=-all\.html)/g)
						?.map(function (value: string, index: number, array: string[]): void {
							if(galleryData['groups'] === null) {
								galleryData['groups'] = [];
							}
							
							galleryData['groups'].push(decodeURIComponent(value));
						});

						galleryContentHtml.match(/(?<=\/series\/)[a-z0-9%]+(?=-all\.html)/g)
						?.map(function (value: string, index: number, array: string[]): void {
							if(galleryData['series'] === null) {
								galleryData['series'] = [];
							}
							
							galleryData['series'].push(decodeURIComponent(value));
						});

						galleryContentHtml.match(/(?<=\/character\/)[a-z0-9%]+(?=-all\.html)/g)
						?.map(function (value: string, index: number, array: string[]): void {
							if(galleryData['characters'] === null) {
								galleryData['characters'] = [];
							}
							
							galleryData['characters'].push(decodeURIComponent(value));
						});

						resolve(galleryData);
						return;
					}
				});
			});
		} catch(error: any) {
			reject(error);
			return;
		}
	})
}

export function getGalleryIdList(range: PageRange, option?: { reverse: boolean; }): Promise<number[]> {
	if(!Number.isInteger(range['startPage']) || (Number.isInteger(range['startPage']) && range['startPage'] < 0)) {
		throw Error('Invalid startPage value');
	} else if(typeof(range['endPage']) !== 'undefined' && (!Number.isInteger(range['endPage']) || (Number.isInteger(range['endPage']) && range['endPage'] <= range['startPage']))) {
		throw Error('Invalid endPage value');
	}

	return new Promise<number[]>(function (resolve: (value: number[] | PromiseLike<number[]>) => void, reject: (reason: any) => void) {
		try {
			const startByte: number = range['startPage'] * 4;
			const endByte: number | string = typeof(range['endPage']) !== 'undefined' ? startByte + range['endPage'] * 4 - 1 : '';
			const reverse: boolean = typeof(option) !== 'undefined' ? option['reverse'] : false;

			fetch('https://ltn.hitomi.la/index-all.nozomi', {
				...requestOption,
				headers: {
					'Range': `bytes=${startByte}-${endByte}`
				}
			})
			.then(function (response: Response): ArrayBuffer | PromiseLike<ArrayBuffer> {
				return response.arrayBuffer();
			})
			.then(function (arrayBuffer: ArrayBuffer): void | PromiseLike<void> {
				const dataView: DataView = new DataView(arrayBuffer);
				const totalLength: number = dataView.byteLength / 4;
			
				let galleryIdList: number[] = [];
				
				if(reverse) {
					for(let i = 0; i < totalLength; i++) {
						galleryIdList.push(dataView.getInt32(i * 4, false));
					}
				}	else {
					for(let i = totalLength - 1; i !== -1; i--) {
						galleryIdList.push(dataView.getInt32(i * 4, false));
					}
				}

				resolve(galleryIdList);
				return;
			});
		} catch(error: any) {
			reject(error);
			return;
		}
	});
}

export function parseTag(tagString: string): Tag[] {
	const tagStringList: string[] = tagString.split(' ');

	if(tagStringList.length < 1) {
		throw Error('Lack of tag');
	}

	let positiveTagStringList: string[] = [...tagStringList].map(function (value: string, index: number, array: string[]): string {
		const splitedTag: string[] = value.replace(/^-/, '').split(':');
		const [type, name]: string[] = [...splitedTag];

		if(splitedTag.length !== 2 || typeof(type) === 'undefined' || typeof(name) === 'undefined' || type === '' || name === '' || !/^(artist|group|type|language|series|tag|male|female)$/.test(type) || !/^[^-_\.][a-z0-9-_.]+$/.test(name)) {
			throw Error('Invalid tag');
		}

		return `${type}:${name}`;
	});

	for(let i = 0; i < positiveTagStringList.length; i++) {
		const name: string = positiveTagStringList[i];
		positiveTagStringList.splice(i, 1);

		if(positiveTagStringList.indexOf(name) !== -1) {
			throw Error('Duplicated tag');
		}
	}

	let tagList: Tag[] = [];

	for(let i = 0; i < tagStringList.length; i++) {
		const [type, name]: string[] = tagStringList[i].replace(/^-/, '').split(':');

		tagList.push({
			// @ts-ignore
			type: type,
			name: name,
			isNegative: tagStringList[i].startsWith('-')
		})
	}

	return tagList;
}

export function queryTag(tagList: Tag[]): Promise<number[]> {
	if(tagList.length < 1) {
		throw Error('Lack of tag');
	}

	let positiveTagList: Tag[] = [];
	let negativeTagList: Tag[] = [];
	
	for(let i = 0; i < tagList.length; i++) {
		switch(typeof(tagList[i]['isNegative']) !== 'undefined' ? tagList[i]['isNegative'] : false) {
			case false:
				positiveTagList.push(tagList[i]);

				break;
			case true:
				negativeTagList.push(tagList[i]);

				break;
		}
	}

	return new Promise<number[]>(async function (resolve: (value: number[] | PromiseLike<number[]>) => void, reject: (reason?: any) => void): Promise<void> {
		try {
			let idList: number[] = [];

			if(positiveTagList.length === 0) {
				idList = await getGalleryIdList({ startPage: 0 });
			}

			for(let i = 0; i < positiveTagList.length; i++) {
				await fetch(getNozomiUrl(positiveTagList[i]), requestOption)
				.then(function (response: Response): Promise<ArrayBuffer> {
					return response.arrayBuffer();
				})
				.then(function (arrayBuffer: ArrayBuffer): void {
					const dataView: DataView = new DataView(arrayBuffer);
					const totalLength: number = dataView.byteLength / 4;

					let queryIdList: number[] = [];

					for(let j = 0; j < totalLength; j++) {
						queryIdList.push(dataView.getInt32(j * 4, false));
					}

					let settedQueryIdList: Set<number> = new Set(queryIdList);
					
					if(i !== 0) {
						idList = idList.filter(function (value: number, index: number, array: number[]): number | void {
							if(settedQueryIdList.has(value)) {
								return value;
							} else {
								return;
							}
						});
					} else {
						idList = [...queryIdList];
					}

					return;
				});
			}

			for(let i = 0; i < negativeTagList.length; i++) {
				await fetch(getNozomiUrl(negativeTagList[i]), requestOption)
				.then(function (response: Response): ArrayBuffer | Promise<ArrayBuffer> {
					return response.arrayBuffer();
				})
				.then(function (arrayBuffer: ArrayBuffer): void | PromiseLike<void> {
					const dataView: DataView = new DataView(arrayBuffer);
					const totalLength: number = dataView.byteLength / 4;

					let queryIdList: number[] = [];

					for(let j = 0; j < totalLength; j++) {
						queryIdList.push(dataView.getInt32(j * 4, false));
					}

					let settedQueryIdList: Set<number> = new Set(queryIdList);

					idList = idList.filter(function (value: number, index: number, array: number[]): number | void {
						if(!settedQueryIdList.has(value)) {
							return value;
						} else {
							return;
						}
					});

					return;
				});
			}

			resolve(idList);
			return;
		} catch(error: any) {
			reject(error);
			return;
		}
	});
}

export default {
	getImageUrl,
	getGalleryUrl,
	getNozomiUrl,
	getGalleryData,
	getGalleryIdList,
	parseTag,
	queryTag
}