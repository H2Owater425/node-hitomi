import { getNozomiUrl, getTagUrl } from "./url";
import { StartingCharacter, Tag, TagType } from "./types";
import { getGalleryIdList } from "./gallery";
import { fetchBuffer, getArrayBuffer } from "./utilities";

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
				// @ts-ignore
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
					const nameValidateRegularExpression: RegExp = RegExp(`^(?=[${startingCharacter !== '123' ? startingCharacter : '0-9'}])[a-z0-9%]+$`);
					let tagList: Tag[] = [];

					for(let i: number = 0; i < mattchedNameList.length; i++) {
						const name: string = decodeURIComponent(mattchedNameList[i]);
						
						if(type !== 'male' && type !== 'female' || mattchedNameList[i].match(nameValidateRegularExpression)) {
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