import type { Hitomi } from './hitomi';
import { Base, HitomiError } from './utilities/structures';
import { formatOneOfState, hashTerm } from './utilities/functions';
import { BINARY_ORDERED_LANGUAGES, NameInitial, GALLERY_TYPES, LANGUAGE_NAMES, FRONT_DOMAIN } from './utilities/constants';
import type { Node } from './utilities/types';
import type { Gallery } from './gallery';

// Moved from gallery to avoid circular dependency
/**
 * Represents a language associated with a gallery.
 *
 * @see {@link Gallery}
 */
export class Language extends Base {
	/**
	 * The URL path to the language-specific galleries.
	 *
	 * @type {string}
	 * @readonly
	 */
	public readonly url: string;

	// @internal
	constructor(
		hitomi: Hitomi,
		/**
		 * The anglicized name of the language.
		 *
		 * @type {string}
		 * @readonly
		 */
		public readonly name: string,
		/**
		 * The native name of the language.
		 *
		 * @type {string}
		 * @readonly
		 */
		public readonly localName: string
	) {
		super(hitomi);

		this['url'] = '/index-' + name + '.html';
	}

	/**
	 * Converts the language into a {@link Tag} instance.
	 *
	 * @param {boolean} [isNegative=false] Whether the tag should be excluded from search.
	 * @returns {Tag} A new {@link Tag} representing the language.
	 */
	public toTag(isNegative: boolean = false): Tag {
		return new Tag(this['hitomi'], 'language', this['name'], isNegative);
	}
}

/**
 * Represents a tag used for searching and categorizing galleries.
 * 
 * @see {@link Gallery}
 * @see {@link TagManager}
 */
export class Tag extends Base {
	/**
	 * The URL path to the tag-specific galleries.
	 * 
	 * @type {string}
	 * @readonly
	 */
	public readonly url: string;

	// @internal
	constructor(
		hitomi: Hitomi,
		/**
		 * The type of the tag.
		 *
		 * @type {'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag'}
		 * @readonly
		 */
		public readonly type: 'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag',
		/**
		 * The name of the tag.
		 *
		 * For `'language'` and `'type'` tags, the name is validated against known values.
		 *
		 * @type {string}
		 * @readonly
		 */
		public readonly name: string,
		/**
		 * Whether the tag should be excluded from search.
		 *
		 * @type {boolean}`
		 * @readonly
		 */
		public readonly isNegative: boolean = false
	) {
		super(hitomi);

		switch(type) {
			case 'male':
			case 'female': {
				this['url'] = '/tag/' + type + '%3A';

				break;
			}

			case 'type': {
				if(!GALLERY_TYPES.has(name as Gallery['type'])) {
					throw new HitomiError('Name', formatOneOfState(GALLERY_TYPES));
				}
			}
			case 'artist':
			case 'group':
			case 'character':
			case 'series':
			case 'tag': {
				this['url'] = '/' + type + '/';

				break;
			}

			case 'language': {
				if(!LANGUAGE_NAMES.has(name)) {
					throw new HitomiError('Name', formatOneOfState(GALLERY_TYPES));
				}
				
				this['url'] = '/index-' + name + '.html';

				return;
			}

			default: {
				throw HitomiError['TAG_TYPE'];
			}
		}

		this['url'] += encodeURIComponent(name) + '-all.html';
	}

	/**
	 * Lists {@link Language} available for galleries matching the tag.
	 *
	 * @returns {Promise<Language[]>} A promise that resolves to an array of {@link Language} instances.
	 */
	public async listLanguages(): Promise<Language[]> {
		const languages: Language[] = [];
		let term: string;
		let i: number = 0;

		switch(this['type']) {
			case 'female':
			case 'male': {
				term = 'tag/' + this['type'] + ':' + this['name'];

				break;
			}

			case 'language': {
				for(; i < BINARY_ORDERED_LANGUAGES['length']; i++) {
					if(this['name'] === BINARY_ORDERED_LANGUAGES[i][0]) {
						// @ts-expect-error
						return [new Language(this['hitomi'], ...BINARY_ORDERED_LANGUAGES[i])];
					}
				}

				// unreachable
			}

			default: {
				term = this['type'] + '/' + this['name'];
			}
		}

		const version: string = await this['hitomi']['languageIndex'].retrieve();
		const rootNode: Node | undefined = await this['hitomi']['languageIndex'].getNodeAtAddress(0n, version);

		if(!rootNode) {
			throw HitomiError['ROOT_NODE_EMPTY'];
		}

		const data: Node[1][number] | undefined = await this['hitomi']['languageIndex'].binarySearch(hashTerm(term), rootNode, version);

		if(!data) {
			throw new HitomiError('Name', 'valid');
		}

		for(let mask: bigint = 1n; i < BINARY_ORDERED_LANGUAGES['length']; i++, mask <<= 1n) {
			if(data[0] & mask) {
				// @ts-expect-error
				languages.push(new Language(this['hitomi'], ...BINARY_ORDERED_LANGUAGES[i]));
			}
		}

		return languages;
	}

	/**
	 * Converts the tag into the string representation.
	 *
	 * The output format is `[-]type:name`, where spaces in the name are replaced with underscores.
	 *
	 * @param {boolean} [isNegative] Overrides whether the tag should be excluded from search. ({@link Tag.isNegative} if omitted)
	 * @returns {string} The formatted tag string.
	 */
	public toString(isNegative: boolean = this['isNegative']): string {
		return (isNegative ? '-' : '') + this['type'] + ':' + this['name'].replace(/ /g, '_');
	}
}

/**
 * Manages creating, parsing, searching, and listing {@link Tag} instances.
 *
 * @see {@link Hitomi}
 */
export class TagManager extends Base {
	// @internal
	constructor(hitomi: Hitomi) {
		super(hitomi);
	}

	/**
	 * Creates a new {@link Tag} instance with the specified type, name, and optional negation.
	 *
	 * The same restrictions on name apply as in {@link Tag.prototype.name | Tag.name}.
	 *
	 * @param {Tag['type']} type The type of the tag.
	 * @param {Tag['name']} name The name of the tag.
	 * @param {boolean} [isNegative=false] Whether the tag should be excluded.
	 * @returns {Tag} A new {@link Tag} instance.
	 * @throws {HitomiError} If `type` or `name` is invalid.
	 */
	public create(type: Tag['type'], name: Tag['name'], isNegative: boolean = false): Tag {
		if(!name['length']) {
			throw new HitomiError('Name', 'empty', false);
		}

		return new Tag(this['hitomi'], type, name.replace(/_/g, ' '), isNegative);
	}

	/**
	 * Parses a space-separated string of tag expressions into an array of {@link Tag} instances.
	 *
	 * Each tag expression should follow the format returned by {@link Tag.prototype.toString | Tag.toString}.
	 *
	 * Duplicated tags and expression without a colon separator are silently ignored.
	 *
	 * @param {string} expression A space-separated string of tag expressions.
	 * @returns {Tag[]} An array of parsed {@link Tag} instances.
	 */
	public parse(expression: string): Tag[] {
		expression = expression.trim() + ' ';

		const tags: Tag[] = [];
		const rawTags: Set<string> = new Set<string>();

		let currentIndex: number = 0;
		let nextIndex: number;
		
		while((nextIndex = expression.indexOf(' ', currentIndex)) !== -1) {
			const colonIndex: number = expression.indexOf(':', currentIndex);

			if(colonIndex !== -1 && colonIndex < nextIndex) {
				const rawTag: string = expression.slice(currentIndex, nextIndex);
				const isNegative: Tag['isNegative'] = expression[currentIndex] === '-';

				if(!rawTags.has(rawTag)) {
					tags.push(this.create(
						expression.slice(currentIndex + (isNegative as unknown as number), colonIndex) as Tag['type'],
						expression.slice(colonIndex + 1, nextIndex),
						isNegative
					));
					rawTags.add(rawTag);
				}
			}

			currentIndex = nextIndex + 1;
		}

		return tags;
	}

	/**
	 * Searches for tags matching the given term.
	 *
	 * Returns an array of tuples, each containing a {@link Tag} and the number of associated galleries.
	 *
	 * @param {string} term The search term, optionally prefixed with a tag type and colon.
	 * @returns {Promise<[Tag, number][]>} A promise that resolves to an array of `[Tag, count]` tuples.
	 */
	public async search(term: string): Promise<[Tag, number][]> {
		const isNegative: boolean = term[0] === '-';
		let i: number = term.indexOf(':') + 1;
		let path: string = '';

		if(i) {
			path = term.slice(isNegative as unknown as number, i - 1);
		} else if(isNegative) {
			i++;
		}

		while(i < term['length'] && term[i] !== ':') {
			path += '/' + term[i++];
		}

		const response: [string, number, Tag['type']][] = JSON.parse(String(await this['hitomi'].request(['tagindex.' + FRONT_DOMAIN, path + '.json'])));
		const tagAndCounts: [Tag, number][] = [];

		for(i = 0; i < response['length']; i++) {
			tagAndCounts.push([
				new Tag(this['hitomi'], response[i][2], response[i][0]),
				response[i][1]
			]);
		}

		return tagAndCounts;
	}

	/**
	 * Lists all available tags of the specified type.
	 *
	 * @param {Tag['type']} type The category type of tags to list.
	 * @param {NameInitial} [startsWith] The initial character to filter by (required for types other than `'language'` and `'type'`).
	 * @returns {Promise<Tag[]>} A promise that resolves to an array of {@link Tag} instances.
	 * @throws {HitomiError} If `startsWith` is not provided for types that require it, or if `type` is invalid.
	 */
	public async list(type: Tag['type'], startsWith?: NameInitial): Promise<Tag[]> {
		const tags: Tag[] = [];
		let names: Set<string> | undefined;

		switch(type) {
			case 'type': {
				names = GALLERY_TYPES;
			}
			case 'language': {
				if(!names) {
					names = LANGUAGE_NAMES;
				}

				for(const name of names) {
					tags.push(new Tag(this['hitomi'], type, name));
				}

				break;
			}

			default: {
				if(!startsWith) {
					throw new HitomiError('StartsWith', 'provided except for language and type');
				}

				// createTagUrn
				let target: string = 'href="/' + type + '/';
				let area: string;

				switch(type) {
					case 'male':
					case 'female': {
						target = 'href="/tag/' + type + '%3A';
					}
					case 'tag': {
						area = 'tags';

						break;
					}

					case 'series': {
						area = type;

						break;
					}

					case 'artist':
					case 'character':
					case 'group': {
						area = type + 's';

						break;
					}

					default: {
						throw HitomiError['TAG_TYPE'];
					}
				}

				const response: string = String(await this['hitomi'].request([FRONT_DOMAIN, '/all' + area + '-' + startsWith + '.html']));
				const endIndex: number = target['length'] - 1;

				let currentIndex: number;
				let nextIndex: number = 0;

				while((currentIndex = response.indexOf(target, nextIndex) + target['length']) !== endIndex) {
					nextIndex = response.indexOf('.', currentIndex);

					if(type !== 'tag' || !response.startsWith('male', currentIndex) && !response.startsWith('female', currentIndex)) {
						tags.push(new Tag(
							this['hitomi'],
							type,
							decodeURIComponent(response.slice(currentIndex, nextIndex - 4))
						));
					}
				}
			}
		}

		return tags;
	}
}