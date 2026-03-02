import type { Hitomi } from './hitomi';
import { Base, HitomiError } from './utilities/structures';
import { formatOneOfState, hashTerm } from './utilities/functions';
import { BINARY_ORDERED_LANGUAGES, NameInitial, GALLERY_TYPES, LANGUAGE_NAMES, FRONT_DOMAIN, TAG_INDEX_DOMAIN } from './utilities/constants';
import type { Node } from './utilities/types';
import type { Gallery } from './gallery';

// Moved from gallery to avoid circular dependency
/**
 * Language associated with galleries.
 *
 * @see {@link Gallery}
 */
export class Language extends Base {
	/**
	 * URL path for language-filtered galleries.
	 *
	 * @type {string}
	 * @readonly
	 */
	public readonly url: string;

	// @internal
	constructor(
		hitomi: Hitomi,
		/**
		 * English name of the language.
		 *
		 * @type {string}
		 * @readonly
		 */
		public readonly name: string,
		/**
		 * Native name of the language.
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
	 * @param {boolean} [isNegative=false] Negative flag for the generated tag.
	 * @returns {Tag} New {@link Tag} instance of type `'language'`.
	 */
	public toTag(isNegative: boolean = false): Tag {
		return new Tag(this['hitomi'], 'language', this['name'], isNegative);
	}
}

/**
 * Search tag used to filter and categorize galleries.
 * 
 * @see {@link Gallery}
 * @see {@link TagManager}
 */
export class Tag extends Base {
	/**
	 * URL path for galleries matching the tag.
	 * 
	 * @type {string}
	 * @readonly
	 */
	public readonly url: string;

	// @internal
	constructor(
		hitomi: Hitomi,
		/**
		 * Type of the tag.
		 *
		 * @type {'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag'}
		 * @readonly
		 */
		public readonly type: 'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag',
		/**
		 * Name of the tag.
		 *
		 * For `'language'` and `'type'` tags, the name is validated against known values.
		 *
		 * @type {string}
		 * @readonly
		 */
		public readonly name: string,
		/**
		 * Whether the tag is used for exclusion.
		 *
		 * @type {boolean}
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
	 * Lists available {@link Language} entries for galleries matching the tag.
	 *
	 * @returns {Promise<Language[]>} Promise that resolves to an array of {@link Language} instances.
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
	 * Converts the tag to its string representation.
	 *
	 * Output format is `[-]type:name`, where spaces are replaced with underscores.
	 *
	 * @param {boolean} [isNegative] Whether the tag is negative. (defaults to {@link Tag.isNegative})
	 * @returns {string} Formatted tag string.
	 */
	public toString(isNegative: boolean = this['isNegative']): string {
		return (isNegative ? '-' : '') + this['type'] + ':' + this['name'].replace(/ /g, '_');
	}
}

/**
 * Manager for creating, parsing, searching, and listing {@link Tag} instances.
 *
 * @see {@link Hitomi}
 */
export class TagManager extends Base {
	// @internal
	constructor(hitomi: Hitomi) {
		super(hitomi);
	}

	/**
	 * Creates a {@link Tag} instance from the specified type and name.
	 *
	 * Name constraints are the same as {@link Tag.prototype.name | Tag.name}.
	 *
	 * @param {Tag['type']} type Type of the tag.
	 * @param {Tag['name']} name Name of the tag.
	 * @param {boolean} [isNegative=false] Whether the tag is negative.
	 * @returns {Tag} New {@link Tag} instance.
	 * @throws {HitomiError} Thrown when `type` or `name` is invalid.
	 */
	public create(type: Tag['type'], name: Tag['name'], isNegative: boolean = false): Tag {
		if(!name['length']) {
			throw new HitomiError('Name', 'empty', false);
		}

		return new Tag(this['hitomi'], type, name.replace(/_/g, ' '), isNegative);
	}

	/**
	 * Parses a space-separated expression into an array of {@link Tag} instances.
	 *
	 * Each tag expression should follow the format returned by {@link Tag.prototype.toString | Tag.toString}.
	 *
	 * Duplicate tags and tokens without a colon separator are ignored.
	 *
	 * @param {string} expression Space-separated tag expression string.
	 * @returns {Tag[]} Array of parsed {@link Tag} instances.
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
					tags.push(new Tag(
						this['hitomi'],
						expression.slice(currentIndex + (isNegative as unknown as number), colonIndex) as Tag['type'],
						expression.slice(colonIndex + 1, nextIndex).replace(/_/g, ' '),
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
	 * Searches for all {@link Tag} entries matching the given term.
	 *
	 * Returns tuples containing each matching {@link Tag} and its gallery count.
	 *
	 * @param {string} term Search term, optionally prefixed with a tag type and colon.
	 * @returns {Promise<[Tag, number][]>} Promise that resolves to an array of `[Tag, count]` tuples.
	 */
	public async search(term: string): Promise<[Tag, number][]> {
		const isNegative: boolean = term[0] === '-';
		let i: number = term.indexOf(':') + 1;
		let path: string;

		if(i) {
			path = '/' + term.slice(isNegative as unknown as number, i - 1);
		} else {
			if(isNegative) {
				i++;
			}

			path = '/global';
		}

		while(i < term['length'] && term[i] !== ':') {
			path += '/' + term[i++];
		}

		const response: [string, number, Tag['type']][] = JSON.parse(String(await this['hitomi'].request([TAG_INDEX_DOMAIN, path + '.json'])));
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
	 * Lists available {@link Tag} entries for the specified type.
	 *
	 * @param {Tag['type']} type Tag type to list.
	 * @param {NameInitial} [startsWith] Initial character filter. Required for types other than `'language'` and `'type'`.
	 * @returns {Promise<Tag[]>} Promise that resolves to an array of {@link Tag} instances.
	 * @throws {HitomiError} Thrown when `startsWith` is missing for required types, or when `type` is invalid.
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