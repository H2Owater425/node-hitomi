import { getNozomiUrl } from "./url";
import { Agent, Tag } from "./types";
import { getGalleryIdList } from "./gallery";
import fetch, { RequestInit, Response } from 'node-fetch';

const requestOption: RequestInit = {
	method: 'GET',
	agent: new Agent({ rejectUnauthorized: false, keepAlive: true }),
	headers: {
		'Accept': '*/*',
		'Accept-Encoding': 'gzip, deflate, br',
		'Connection': 'keep-alive'
	}
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
		});
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

	return new Promise<number[]>(function (resolve: (value: number[] | PromiseLike<number[]>) => void, reject: (reason?: any) => void): void {
		try {
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
			});
		} catch(error: any) {
			reject(error);

			return;
		}
	});
}