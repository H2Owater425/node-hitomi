import type { Hitomi } from '../hitomi';
import { Base } from '../internal/base';
import { HitomiError } from './error';
import type { Node } from '../internal/types';
import { Gallery } from './gallery';

/**
 * A language associated with a {@link Gallery}.
 *
 * @see {@link Gallery}
 */
export class Language extends Base {
	// @internal - Binary ordered name and localName
	public static readonly ORDERED: readonly [string, string][] = [
		['indonesian', 'Bahasa Indonesia'],
		['javanese', 'Basa Jawa'],
		['catalan', 'Català'],
		['cebuano', 'Cebuano'],
		['czech', 'Čeština'],
		['danish', 'Dansk'],
		['german', 'Deutsch'],
		['estonian', 'Eesti'],
		['english', 'English'],
		['spanish', 'Español'],
		['esperanto', 'Esperanto'],
		['french', 'Français'],
		['hindi', 'Hindi'],
		['icelandic', 'Íslenska'],
		['italian', 'Italiano'],
		['latin', 'Latina'],
		['hungarian', 'Magyar'],
		['dutch', 'Nederlands'],
		['norwegian', 'Norsk'],
		['polish', 'Polski'],
		['portuguese', 'Português'],
		['romanian', 'Română'],
		['albanian', 'Shqip'],
		['slovak', 'Slovenčina'],
		['serbian', 'Srpski'],
		['finnish', 'Suomi'],
		['swedish', 'Svenska'],
		['tagalog', 'Tagalog'],
		['vietnamese', 'Tiếng Việt'],
		['turkish', 'Türkçe'],
		['greek', 'Ελληνικά'],
		['bulgarian', 'Български'],
		['mongolian', 'Монгол'],
		['russian', 'Русский'],
		['ukrainian', 'Українська'],
		['hebrew', 'עברית'],
		['arabic', 'العربية'],
		['persian', 'فارسی'],
		['thai', 'ไทย'],
		['burmese', 'မြန်မာဘာသာ'],
		['korean', '한국어'],
		['chinese', '中文'],
		['japanese', '日本語']
	];
	// @internal
	public static readonly NAMES: Set<string> = new Set<string>();

	/**
	 * The URL path for browsing galleries filtered by this language.
	 *
	 * @type {string}
	 * @readonly
	 */
	public readonly url: string;

	// @internal
	constructor(
		hitomi: Hitomi,
		/**
		 * The English name of the language.
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
	 * Converts this language into a {@link Tag} of type `'language'`.
	 *
	 * @param {boolean} [isNegative=false] Whether to create a negative tag.
	 * @returns {Tag} A new {@link Tag}.
	 */
	public toTag(isNegative: boolean = false): Tag {
		return new Tag(this['hitomi'], 'language', this['name'], isNegative);
	}
}

for(let i: number = 0; i < Language['ORDERED']['length']; i++) {
	Language['NAMES'].add(Language['ORDERED'][i][0]);
}

/**
 * A tag used to filter and categorize galleries.
 *
 * @see {@link Gallery}
 * @see {@link TagManager}
 */
export class Tag extends Base {
	// @internal
	public static readonly TYPES: Set<Tag['type']> = new Set<Tag['type']>([
		'artist',
		'group',
		'type',
		'language',
		'series',
		'character',
		'male',
		'female',
		'tag'
	]);

	// @internal
	public static compare(a: Tag, b: Tag): number {
		return (a['isNegative'] as unknown as number) - (b['isNegative'] as unknown as number);
	}

	/**
	 * The URL path for browsing galleries matching this tag.
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
		 * Whether this tag is negative and excludes matching galleries.
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
				if(!Gallery['TYPES'].has(name as Gallery['type'])) {
					throw HitomiError.invalidMember('Name', Gallery['TYPES']);
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
				if(!Language['NAMES'].has(name)) {
					throw HitomiError.invalidMember('Name', Language['NAMES']);
				}

				this['url'] = '/index-' + name + '.html';

				return;
			}

			default: {
				throw HitomiError.invalidMember('Type', Tag['TYPES']);
			}
		}

		this['url'] += encodeURIComponent(name) + '-all.html';
	}

	/**
	 * Lists the available languages for galleries matching this tag.
	 *
	 * @returns {Promise<Language[]>} A `Promise` that resolves to an array of languages.
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
				for(; i < Language['ORDERED']['length']; i++) {
					if(this['name'] === Language['ORDERED'][i][0]) {
						return [new Language(this['hitomi'], Language['ORDERED'][i][0], Language['ORDERED'][i][1])];
					}
				}

				throw HitomiError['invalidTagName'];
			}

			default: {
				term = this['type'] + '/' + this['name'];
			}
		}

		const version: string = await this['hitomi']['languageIndex'].retrieve();
		const rootNode: Node | undefined = await this['hitomi']['languageIndex'].getNodeAtAddress(0n, version);

		if(!rootNode) {
			throw HitomiError['emptyRootNode'];
		}

		const data: Node[1][number] | undefined = await this['hitomi']['languageIndex'].binarySearch(await this['hitomi'].hash(term), rootNode, version);

		if(!data) {
			throw HitomiError['invalidTagName'];
		}

		for(let mask: bigint = 1n; i < Language['ORDERED']['length']; i++, mask <<= 1n) {
			if(data[0] & mask) {
				languages.push(new Language(this['hitomi'], ...Language['ORDERED'][i]));
			}
		}

		return languages;
	}

	/**
	 * Converts this tag to its string representation.
	 *
	 * The output format is `[-]type:name`, where spaces in the name are replaced with underscores.
	 *
	 * @param {boolean} [isNegative] Whether to format as a negative tag. Defaults to {@link Tag.isNegative}.
	 * @returns {string} The formatted tag string.
	 */
	public toString(isNegative: boolean = this['isNegative']): string {
		return (isNegative ? '-' : '') + this['type'] + ':' + this['name'].replace(/ /g, '_');
	}
}