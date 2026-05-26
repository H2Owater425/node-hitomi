import { ResponseType } from '@platform';
import { HitomiError } from '../structures/error';
import type { Hitomi } from '../hitomi';
import { TAG_TYPES, TAG_INDEX_DOMAIN, GALLERY_TYPES, LANGUAGE_NAMES, FRONT_DOMAIN } from '../internal/constants';
import { Base } from '../internal/base';
import { Tag } from '../structures/tag';

/**
 * Initial character filters for listing tags.
 *
 * @readonly
 * @enum {string}
 */
export const enum NameInitial {
	A = 'a',
	B = 'b',
	C = 'c',
	D = 'd',
	E = 'e',
	F = 'f',
	G = 'g',
	H = 'h',
	I = 'i',
	J = 'j',
	K = 'k',
	L = 'l',
	M = 'm',
	N = 'n',
	O = 'o',
	P = 'p',
	Q = 'q',
	R = 'r',
	S = 's',
	T = 't',
	U = 'u',
	V = 'v',
	W = 'w',
	X = 'x',
	Y = 'y',
	Z = 'z',
	/**
	 * Matches all tags starting with a non-alphabetic character.
	 */
	_123 = '123'
}

/**
 * A manager for creating, parsing, searching, and listing tags.
 *
 * @see {@link Hitomi}
 */
export class TagManager extends Base {
	// @internal
	constructor(hitomi: Hitomi) {
		super(hitomi);
	}

	/**
	 * Creates a new {@link Tag} from the given type and name.
	 *
	 * The same name constraints as {@link Tag.prototype.name | Tag.name} apply.
	 *
	 * @param {Tag['type']} type The tag type.
	 * @param {Tag['name']} name The tag name.
	 * @param {boolean} [isNegative=false] Whether to create a negative tag.
	 * @returns {Tag} A new {@link Tag}.
	 * @throws {HitomiError} If `type` or `name` is invalid.
	 */
	public create(type: Tag['type'], name: Tag['name'], isNegative: boolean = false): Tag {
		if (!name['length']) {
			throw new HitomiError('Name', 'empty', false);
		}

		return new Tag(this['hitomi'], type, name.replace(/_/g, ' '), isNegative);
	}

	/**
	 * Parses a space-separated string into tags.
	 *
	 * Each token should follow the format produced by {@link Tag.prototype.toString | Tag.toString}.
	 *
	 * Duplicate tags and tokens without a colon separator are silently ignored.
	 *
	 * @param {string} expression A space-separated tag expression string.
	 * @returns {Tag[]} An array of parsed tags.
	 */
	public parse(expression: string): Tag[] {
		expression = expression.trim() + ' ';

		const tags: Tag[] = [];
		const rawTags: Set<string> = new Set<string>();

		let currentIndex: number = 0;
		let nextIndex: number;

		while ((nextIndex = expression.indexOf(' ', currentIndex)) !== -1) {
			const colonIndex: number = expression.indexOf(':', currentIndex);

			if (colonIndex !== -1 && colonIndex < nextIndex) {
				const rawTag: string = expression.slice(currentIndex, nextIndex);
				const isNegative: Tag['isNegative'] = expression[currentIndex] === '-';

				if (!rawTags.has(rawTag)) {
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
	 * Searches for tags matching the given term.
	 *
	 * Returns each matching {@link Tag} paired with its gallery count.
	 *
	 * @param {string} term The search term, optionally prefixed with a tag type and colon (e.g. `"artist:name"`).
	 * @returns {Promise<[Tag, number][]>} A `Promise` that resolves to an array of `[Tag, count]` tuples.
	 * @throws {HitomiError} If the specified tag type is invalid.
	 */
	public async search(term: string): Promise<[Tag, number][]> {
		const isNegative: boolean = term[0] === '-';
		let i: number = term.indexOf(':') + 1;
		let path: string;

		if (i) {
			const type: Tag['type'] = term.slice(isNegative as unknown as number, i - 1) as Tag['type'];

			if (!TAG_TYPES.has(type)) {
				throw HitomiError['OneOfTagType'];
			}

			path = '/' + type;
		} else {
			if (isNegative) {
				i++;
			}

			path = '/global';
		}

		while (i < term['length'] && term[i] !== ':') {
			path += '/' + term[i++];
		}

		const response: [string, number, Tag['type']][] = await this['hitomi'].request(TAG_INDEX_DOMAIN, path + '.json', ResponseType['JSON']) as [string, number, Tag['type']][];
		const tagAndCounts: [Tag, number][] = [];

		for (i = 0; i < response['length']; i++) {
			tagAndCounts.push([
				new Tag(this['hitomi'], response[i][2], response[i][0]),
				response[i][1]
			]);
		}

		return tagAndCounts;
	}

	/**
	 * Lists all available tags for the specified type.
	 *
	 * @param {Tag['type']} type The tag type to list.
	 * @param {NameInitial} [startsWith] The initial character filter. Required for all types except `'language'` and `'type'`.
	 * @returns {Promise<Tag[]>} A `Promise` that resolves to an array of tags.
	 * @throws {HitomiError} If `startsWith` is missing for types that require it, or if `type` is invalid.
	 */
	public async list(type: Tag['type'], startsWith?: NameInitial): Promise<Tag[]> {
		const tags: Tag[] = [];
		let names: Set<string> | undefined;

		switch (type) {
			case 'type': {
				names = GALLERY_TYPES;
			}
			case 'language': {
				if (!names) {
					names = LANGUAGE_NAMES;
				}

				for (const name of names) {
					tags.push(new Tag(this['hitomi'], type, name));
				}

				break;
			}

			default: {
				if (!startsWith) {
					throw new HitomiError('StartsWith', 'provided except for language and type');
				}

				// createTagUrn
				let target: string = 'href="/' + type + '/';
				let area: string;

				switch (type) {
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
						throw HitomiError['OneOfTagType'];
					}
				}

				const response: string = await this['hitomi'].request(FRONT_DOMAIN, '/all' + area + '-' + startsWith + '.html', ResponseType['TEXT']);
				const endIndex: number = target['length'] - 1;

				let currentIndex: number;
				let nextIndex: number = 0;

				while ((currentIndex = response.indexOf(target, nextIndex) + target['length']) !== endIndex) {
					nextIndex = response.indexOf('.', currentIndex);

					if (type !== 'tag' || !response.startsWith('male', currentIndex) && !response.startsWith('female', currentIndex)) {
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