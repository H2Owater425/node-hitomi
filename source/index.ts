import { IncomingMessage } from 'http';
import { request, Agent, AgentOptions } from 'https';
import { connect, TLSSocket } from 'tls';

module hitomi {
	// type definition

	interface LooseObject {
		[key: string]: any;
	}

	type RequiredProperty<T> = { [P in keyof T]-?: RequiredProperty<NonNullable<T[P]>> };

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

	export type PopularityPeriod = 'day' | 'week' | 'month' | 'year';

	export type StartingCharacter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | '0-9';

	const galleryCommonTypes: readonly string[] = ['artist', 'group', 'parody', 'character'];

	// utility

	class HitomiError extends Error {
		private code: 'INVALID_VALUE' | 'DUPLICATED_ELEMENT' | 'LACK_OF_ELEMENT' | 'REQEUST_REJECTED' | 'INVALID_SEQUENCE' | 'UNKNOWN' = 'UNKNOWN';

		constructor(key: HitomiError['code'], argument: string) {
			super('Unknown');

			this['code'] = key;

			switch(key) {
				case 'INVALID_VALUE': {
					this['message'] = 'Value of % was not valid';

					break;
				}

				case 'DUPLICATED_ELEMENT': {
					this['message'] = 'Element of % was duplicated';

					break;
				}

				case 'LACK_OF_ELEMENT': {
					this['message'] = 'Elements of % was not enough';

					break;
				}

				case 'REQEUST_REJECTED': {
					this['message'] = 'Request to % was rejected';

					break;
				}

				case 'INVALID_SEQUENCE': {
					this['message'] = 'Must execute % before';

					break;
				}
			}

			this['message'] = this['message'].replace('%', argument.includes('\'') ? '`%`' : '\'%\'').replace('%', argument);
		}

		get name(): string {
			return 'HitomiError [' + this['code'] + ']';
		}
	}

	function get32BitIntegerNumbers(buffer: Buffer): Set<number> {
		const dataView: DataView = new DataView(buffer['buffer']);
		const numberCount: number = dataView['byteLength'] / 4;

		let numbers: Set<number> = new Set<number>();

		for(let i: number = 0; i < numberCount; i++) {
			numbers.add(dataView.getInt32(i * 4));
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

	export function getNozomiUrl(options: { tag?: Tag, orderByPopularityPeriod?: PopularityPeriod; } = {}): string {
		const isTagTypeLanguage: boolean = options['tag']?.['type'] === 'language';

		let path: string = '';
		let language: string = 'all';

		if(typeof(options['tag']) === 'object' && !isTagTypeLanguage) {
			switch(options['tag']['type']) {
				case 'male':
				case 'female': {
					path = 'tag/' + options['tag']['type'] + ':' + options['tag']['name'].replace(/_/g, ' ');

					break;
				}

				default: {
					path = options['tag']['type'] + '/' + options['tag']['name'].replace(/_/g, ' ');

					break;
				}
			}
		} else {
			if(isTagTypeLanguage) {
				language = (options['tag'] as Tag)['name'];
			}

			path = options['orderByPopularityPeriod'] || 'index';
		}

		return 'https://ltn.hitomi.la/' + (typeof(options['orderByPopularityPeriod']) !== 'string' ? 'n' : 'popular') + '/' + (path !== 'day' ? path : 'today') + '-' + language + '.nozomi';
	}

	export function getTagUrl(type: Tag['type'], options: { startWith?: StartingCharacter; } = {}): string {
		const isTypeNotLanguage: boolean = type !== 'language';

		if((typeof(options['startWith']) !== 'undefined') === isTypeNotLanguage/* ~((typeof(options['startWith']) !== 'undefined') ^ isTypeNotLanguage) */) {
			let subdomain: string = 'ltn.';
			let path: string = 'all';

			if(isTypeNotLanguage) {
				switch(type) {
					case 'tag':
					case 'male':
					case 'female': {
						path += 'tags';

						break;
					}

					case 'artist':
					case 'series':
					case 'character':
					case 'group': {
						path += type + (type.charAt(type['length'] - 1) !== 's' ? 's' : '');

						break;
					}

					default: {
						throw new HitomiError('INVALID_VALUE', 'extension');
					}
				}

				path += '-' + (options['startWith'] !== '0-9' ? options['startWith'] : '123') + '.html';
			} else {
				subdomain = '';
				path = 'language_support.js';
			}

			return 'https://' + subdomain + 'hitomi.la/' + path;
		} else {
			throw new HitomiError('INVALID_VALUE', 'options[\'startWith\']');
		}
	}

	export class ImageUrlResolver {
		#pathCode?: string;
		#subdomainRegularExpression?: RegExp;
		#isFirstSubdomainA = true;

		#getRegexString(tree: LooseObject, root?: string): string {
			let regularExpressionString: string = '';

			const roots: string[] = Object.keys(tree);

			if(typeof(root) === 'undefined') {
				for(let i: number = 0; i < roots['length']; i++) {
					regularExpressionString += this.#getRegexString(tree[roots[i]], roots[i]);
				}
			} else {
				regularExpressionString += '|' + root + '(';
				let isOptional: boolean = false;

				for(let i: number = 0; i < roots['length']; i++) {
					if(roots[i] === '') {
						isOptional = true;
					} else {
						if(Object.keys(tree[roots[i]])['length'] !== 0) {
							regularExpressionString += this.#getRegexString(tree[roots[i]], roots[i]);
						}
					}
				}

				regularExpressionString += ')';

				if(isOptional) {
					regularExpressionString += '?';
				}
			}

			return regularExpressionString;
		}

		public synchronize(): Promise<ImageUrlResolver> {
			const _this: this = this;

			return new Promise<typeof this>(function (resolve: (value: typeof _this) => void, reject: (reason?: any) => void): void {
				fetchBuffer('https://ltn.hitomi.la/gg.js')
				.then(function (buffer: Buffer): void {
					const splitResponseStrings: string[] = buffer.toString().split('\n');

					let subdomainCodes: string[] = [];

					for(let i: number = 0; i < splitResponseStrings['length']; i++) {
						switch(splitResponseStrings[i].charAt(0)) {
							case 'b': {
								_this.#pathCode = splitResponseStrings[i].slice(0, -2).split('\'').pop();

								if(typeof(_this.#pathCode) !== 'undefined') {
									break;
								} else {
									reject(new HitomiError('INVALID_VALUE', 'ImageUrlResolver[\'#pathCode\']'));

									return;
								}
							}

							case 'c': {
								let subdomainCodeWithColon = splitResponseStrings[i].split(' ').pop();

								if(typeof(subdomainCodeWithColon) === 'string') {
									subdomainCodes.push(subdomainCodeWithColon.slice(0, -1));
								} else {
									reject(new HitomiError('INVALID_VALUE', 'subdomainCodes[' + i + ']'));

									return;
								}

								break;
							}

							case 'o': {
								if(splitResponseStrings[i].split(' = ').pop()?.charAt(0) === '1') {
									_this.#isFirstSubdomainA = false;
								}

								break;
							}
						}
					}

					let subdomainCodeTree: LooseObject = {};

					for(let i: number = 0; i < subdomainCodes['length']; i++) {
						let targetTree: LooseObject = subdomainCodeTree;
						const _subdomainCodes: string[] = subdomainCodes[i].split('');

						for(let j: number = 0; j < _subdomainCodes['length']; j++) {
							if(typeof(targetTree[_subdomainCodes[j]]) !== 'object') {
								targetTree[_subdomainCodes[j]] = {};
							}

							targetTree = targetTree[_subdomainCodes[j]];

							if(j === _subdomainCodes['length'] - 1) {
								targetTree[''] = {};
							}
						}
					}

					let splitSubdomainRegularExpressionStrings: string[] = _this.#getRegexString(subdomainCodeTree).replace(/\(\)\?|((?<=\()|^)\||\((?=\|[0-9]\(\)\?\))|(?<=\(\|[0-9]\(\)\?)\)|\|(?=[0-9]\(\))/g, '').split(/\((?=[0-9]{2,}\))|(?<=\([0-9]{2,})\)/);

					for(let i: number = 0; i < splitSubdomainRegularExpressionStrings['length']; i++) {
						if(i % 2 === 1) {
							let _splitSubdomainRegularExpressionStrings: string[] = splitSubdomainRegularExpressionStrings[i].split('');

							let distance: number = 0;

							for(let j: number = 0; j < _splitSubdomainRegularExpressionStrings['length']; j++) {
								if(j + distance < _splitSubdomainRegularExpressionStrings['length'] && Number(_splitSubdomainRegularExpressionStrings[j]) + distance === Number(_splitSubdomainRegularExpressionStrings[j + distance])) {
									distance++;
									j--;
								} else if(distance !== 1) {
									_splitSubdomainRegularExpressionStrings[j] += '-' + _splitSubdomainRegularExpressionStrings[j + distance - 1];

									_splitSubdomainRegularExpressionStrings = _splitSubdomainRegularExpressionStrings.slice(0, j + 1).concat(_splitSubdomainRegularExpressionStrings.slice(j + distance));

									distance = 0;
								}
							}

							splitSubdomainRegularExpressionStrings[i] = '[' + _splitSubdomainRegularExpressionStrings.join('') + ']';
						}
					}

					_this.#subdomainRegularExpression = new RegExp('^(' + splitSubdomainRegularExpressionStrings.join('') + ')$');

					if(_this.#subdomainRegularExpression['source'] !== '(?:)') {
						resolve(_this);
					} else {
						reject(new HitomiError('INVALID_VALUE', 'ImageUrlResolver[\'#subdomainRegularExpression\']'));
					}

					return;
				});

				return;
			});
		}

		public getImageUrl(image: Image, extension: 'avif' | 'webp', options: { isThumbnail?: boolean; isSmall?: boolean; } = {}): string {
			if(typeof(this.#pathCode) === 'string' && this.#subdomainRegularExpression instanceof RegExp) {
				options['isThumbnail'] = typeof(options['isThumbnail']) === 'boolean' && options['isThumbnail'];
				options['isSmall'] = typeof(options['isSmall']) === 'boolean' && options['isSmall'];

				switch(extension) {
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
					if(Number.isInteger(image['index']) && image['index'] >= 0) {
						const imageHashCode: string = String(Number.parseInt(image['hash'].slice(-1) + image['hash'].slice(-3, -1), 16));

						let subdomain: string = 'a';
						// Reference make_source_element function from https://ltn.hitomi.la/reader.js
						let path: string = extension;

						if(!options['isThumbnail']) {
							path += '/' + this.#pathCode + '/' + imageHashCode + '/' + image['hash'];
						} else {
							if(options['isSmall']) {
								if(extension === 'avif') {
									path += 'small';
								} else {
									throw new HitomiError('INVALID_VALUE', 'options[\'isSmall\']');
								}
							}

							path +=  'bigtn/' + image['hash'].slice(-1) + '/' + image['hash'].slice(-3, -1)  + '/' + image['hash'];
							subdomain = 'tn';
						}

						// Reference subdomain_from_url function from https://ltn.hitomi.la/common.js
						return 'https://' + (this.#subdomainRegularExpression.test(imageHashCode) === this.#isFirstSubdomainA/* ~(this.#subdomainRegularExpression.test(imageHashCode) ^ this.#isMatchCharacterA) */ ? 'a' : 'b') + subdomain + '.hitomi.la/' + path + '.' + extension;
					} else {
						throw new HitomiError('INVALID_VALUE', 'image[\'index\']');
					}
				} else {
					throw new HitomiError('INVALID_VALUE', 'image[\'hash\']');
				}
			} else {
				throw new HitomiError('INVALID_SEQUENCE', 'synchronize()');
			}
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

	export function getGallery(id: number, options: { includeFiles?: boolean/* = true */; includeRelatedIds?: boolean/* = false */; } = {}): Promise<Gallery> {
		if(Number.isInteger(id) && id > 0) {
			return new Promise<Gallery>(function (resolve: (value: Gallery) => void, reject: (reason?: any) => void): void {
				fetchBuffer('https://ltn.hitomi.la/galleries/' + id + '.js')
				.then(function (buffer: Buffer): void {
					const responseJson: LooseObject = JSON.parse(buffer.toString('utf8').slice(18));

					let gallery: Gallery = JSON.parse('{"id":' + id + ',"title":{"display":"' + responseJson['title'].replace(/\"/g, '\\"') + '","japanese":' + (responseJson['japanese_title'] !== null ? '"' + responseJson['japanese_title'].replace(/\"/g, '\\"') + '"' : 'null') + '},"type":"' + responseJson['type'] + '","languageName":{"english":' + (responseJson['language'] !== null ? '"' + responseJson['language'] + '"' : 'null') + ',"local":' + (responseJson['language_localname'] !== null ? '"' + responseJson['language_localname'] + '"' : 'null') + '},"artists":[],"groups":[],"series":[],"characters":[],"tags":[],"files":[],"publishedDate":null,"translations":[],"relatedIds":[]}');

					for(let i: number = 0; i < galleryCommonTypes['length']; i++) {
						const pluralType: string = galleryCommonTypes[i] + 's';

						if(responseJson[pluralType] !== null) {
							for(let j: number = 0; j < responseJson[pluralType]['length']; j++) {
								gallery[(pluralType.charAt(0) !== 'p' ? pluralType : 'series') as 'artists' | 'groups' | 'series' | 'characters'].push(responseJson[pluralType][j][galleryCommonTypes[i]]);
							}
						}
					}

					if(responseJson['tags'] !== null) {
						for(let i: number = 0; i < responseJson['tags']['length']; i++) {
							let type: Tag['type'] = 'tag';

							if(responseJson['tags'][i]['male'] === 1) {
								type = 'male';
							} else if(responseJson['tags'][i]['female'] === 1) {
								type = 'female';
							}

							gallery['tags'].push({
								type: type,
								name: responseJson['tags'][i]['tag']
							});
						}
					}

					if(typeof(options['includeFiles']) === 'boolean' && options['includeFiles']) {
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

					if(typeof(options['includeRelatedIds']) === 'boolean' && options['includeRelatedIds']) {
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

	export function getIds(options: { tags?: Tag[]/* = [] */; range?: { startIndex?: number/* = 0 */; endIndex?: number; }/* = {} */; orderByPopularityPeriod?: PopularityPeriod; reverseResult?: boolean/* = false */; } = {}): Promise<number[]> {
		return new Promise<number[]>(function (resolve: (value: number[]) => void, reject: (reason: any) => void) {
			const isTagsInvalid: boolean = !Array.isArray(options['tags']) || options['tags']['length'] === 0;

			if(!Number.isInteger(options['range']?.['startIndex']) || options['range']?.['startIndex'] as number >= 0) {
				if(!Number.isInteger(options['range']?.['endIndex']) || (options['range']?.['endIndex'] as number) >= (options['range']?.['startIndex'] || 0)) {
					(isTagsInvalid ? [] : options['tags'] as Tag[]).reduce(function (promise: Promise<Set<number>>, tag: Tag): Promise<Set<number>> {
						return promise.then(function (ids: Set<number>): Promise<Set<number>> {
							return new Promise<Set<number>>(function (resolve: (value: Set<number>) => void, reject: (reason?: any) => void): void {
								fetchBuffer(getNozomiUrl({ tag: tag }))
								.then(function (buffer: Buffer): void {
									const _ids: Set<number> = get32BitIntegerNumbers(buffer);
									const isTagNegative: boolean = typeof(tag['isNegative']) === 'boolean' && tag['isNegative'];

									ids.forEach(function (id: number): void {
										if(isTagNegative === _ids.has(id)/* ~(isTagNegative ^ _ids.has(id)) */) {
											ids.delete(id);
										}

										return;
									});

									resolve(ids);

									return;
								})
								.catch(reject);

								return;
							});
						});
					}, isTagsInvalid || typeof(options['orderByPopularityPeriod']) === 'string' || typeof((options['tags'] as Tag[])[0]['isNegative']) === 'boolean' && (options['tags'] as Tag[])[0]['isNegative'] ? new Promise<Set<number>>(function (resolve: (value: Set<number>) => void, reject: (reason?: any) => void): void {
						fetchBuffer(getNozomiUrl({ orderByPopularityPeriod: options['orderByPopularityPeriod'] }), isTagsInvalid ? { Range: 'bytes=' + ((options['range'] as RequiredProperty<NonNullable<typeof options['range']>>)['startIndex'] * 4 || '0') + '-' + ((options['range'] as RequiredProperty<NonNullable<typeof options['range']>>)['endIndex'] * 4 + 3 || '') } : undefined)
						.then(function (buffer: Buffer): void {
							resolve(get32BitIntegerNumbers(buffer));

							return;
						})
						.catch(reject);
					}) : new Promise<Set<number>>(function (resolve: (value: Set<number>) => void, reject: (reason?: any) => void): void {
						fetchBuffer(getNozomiUrl({ tag: (options['tags'] as Tag[]).shift() }))
						.then(function (buffer: Buffer): void {
							resolve(get32BitIntegerNumbers(buffer));

							return;
						})
						.catch(reject);

						return;
					}))
					.then(function (ids: Set<number>): void {
						let _ids: number[] = Array.from(ids);

						if(typeof(options['reverseResult']) === 'boolean' && options['reverseResult']) {
							_ids.reverse();
						}

						_ids = _ids.slice(options['range']?.['startIndex'], options['range']?.['endIndex']);

						resolve(_ids);

						return;
					})
					.catch(reject);
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
				const splitPositiveTagStrings: string[] = splitTagStrings[i].replace(/^-/, '').split(':');

				if(splitPositiveTagStrings['length'] === 2 && /^(artist|group|series|tag|(languag|typ|(fe)?mal)e)$/.test(splitPositiveTagStrings[0]) && /^[^-_\.][a-z0-9-_.]+$/.test(splitPositiveTagStrings[1])) {
					const positiveTagString: string = splitPositiveTagStrings[0] + ':' + splitPositiveTagStrings[1];

					if(!positiveTagStrings.has(positiveTagString)) {
						tags.push({
							type: splitPositiveTagStrings[0] as Tag['type'],
							name: splitPositiveTagStrings[1],
							isNegative: splitTagStrings[i].charAt(0) === '-'
						});

						positiveTagStrings.add(positiveTagString);
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

	export function getTags(type: Tag['type'], options: { startWith?: StartingCharacter; } = {}): Promise<Tag[]> {
		return new Promise<Tag[]>(function (resolve: (value: Tag[]) => void, reject: (reason?: any) => void): void {
			const isTypeType: boolean = type === 'type';

			if((typeof(options['startWith']) === 'undefined') !== (type !== 'language' && !isTypeType)) {
				if(!isTypeType) {
					fetchBuffer(getTagUrl(type, { startWith: options['startWith'] }))
					.then(function (buffer: Buffer): void {
						const matchedNames: string[] = buffer.toString('utf8').match(RegExp(type === 'language' ? '(?<=")(?!all)[a-z]+(?=":)' : '(?<=\/tag\/' + (type === 'male' || type === 'female' ? type + '%3A' : '') + ')[a-z0-9%]+(?=-all\\.html)', 'g')) || [];
						let tags: Tag[] = [];
						const isTypeGender: boolean = type === 'tag' || type === 'male';
						const matchedNames: string[] = buffer.toString('utf8').match(RegExp(type === 'language' ? '(?<=")(?!all)[a-z]+(?=":)' : '(?<=\/' + (isTypeGender || type === 'tag' ? 'tag\/' : '') + (isTypeGender ? type + '%3A' : '') + ')[a-z0-9%]+(?=-all\\.html)', 'g')) || [];

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
						name: 'anime'
					}, {
						type: 'type',
						name: 'artistcg'
					}, {
						type: 'type',
						name: 'doujinshi'
					}, {
						type: 'type',
						name: 'gamecg'
					}, {
						type: 'type',
						name: 'manga'
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