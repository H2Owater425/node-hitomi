import { Gallery, LooseObject, OrderCriteria, Tag } from "./types";
import { getGalleryUrl } from "./url";
import fetch, { Response } from 'node-fetch';
import { isInteger, requestOption } from "./utilities";

export function getGalleryData(id: number, option?: { includeFullData?: boolean; includeFiles?: boolean; }): Promise<Gallery> {
	if(!isInteger(id) || (isInteger(id) && id < 1)) {
		throw Error('Invalid id value');
	} else {
		const includeFiles: boolean = typeof(option) !== 'undefined' && typeof(option['includeFiles']) !== 'undefined' ? option['includeFiles'] : true;
		const includeFullData: boolean = typeof(option) !== 'undefined' && typeof(option['includeFullData']) !== 'undefined' ? option['includeFullData'] : true;
	
		return new Promise<Gallery>(function (resolve: (value: Gallery | PromiseLike<Gallery>) => void, reject: (reason?: any) => void): void {
			fetch(`https://ltn.hitomi.la/galleries/${id}.js`, requestOption)
			.then(function (response: Response): string | PromiseLike<string> {
				return response.text();
			})
			.then(function (responseText: string): void | PromiseLike<void> {
				const responseJson: LooseObject = JSON.parse(responseText.slice(18));

				let galleryData: Gallery = {
					id: responseJson['id'],
					title: responseJson['title'],
					japaneseTitle: responseJson['japanese_title'],
					type: responseJson['type'],
					languageName: responseJson['language'],
					localLanguageName: responseJson['language_localname'],
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
					fetch(getGalleryUrl(galleryData), requestOption)
					.then(function (_response: Response): string | PromiseLike<string> {
						return _response.text();
					})
					.then(function (_responseText: string): void | PromiseLike<void> {
						const galleryContentHtml: string = _responseText.split('content">')[1];

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

			fetch(`https://ltn.hitomi.la/${orderBy}-all.nozomi`, {
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