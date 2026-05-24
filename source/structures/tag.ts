import type { Hitomi } from '../hitomi';
import { Base } from '../internal/structures';
import { HitomiError } from './error';
import { BINARY_ORDERED_LANGUAGES, GALLERY_TYPES, LANGUAGE_NAMES } from '../internal/constants';
import type { Node } from '../internal/types';
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
					throw HitomiError['OneOfGalleryType'];
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
					throw HitomiError['OneOfGalleryType'];
				}

				this['url'] = '/index-' + name + '.html';

				return;
			}

			default: {
				throw HitomiError['OneOfTagType'];
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
						return [new Language(this['hitomi'], BINARY_ORDERED_LANGUAGES[i][0], BINARY_ORDERED_LANGUAGES[i][1])];
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
			throw HitomiError['RootNodeEmpty'];
		}

		const data: Node[1][number] | undefined = await this['hitomi']['languageIndex'].binarySearch(await this['hitomi'].hash(term), rootNode, version);

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