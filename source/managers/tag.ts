import { ResponseType } from '@platform';
import { HitomiError } from '../error';
import type { Hitomi } from '../hitomi';
import { TAG_TYPES, TAG_INDEX_DOMAIN, GALLERY_TYPES, LANGUAGE_NAMES, FRONT_DOMAIN } from '../internal/constants';
import { Base } from '../internal/structures';
import { Tag } from '../tag';

/**
 * Initial-character filters for listing tags.
 *
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
	 * Represents all non-alphabetic characters.
	 */
	_123 = '123'
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
		if (!name['length']) {
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
	 * Searches for all {@link Tag} entries matching the given term.
	 *
	 * Returns tuples containing each matching {@link Tag} and its gallery count.
	 *
	 * @param {string} term Search term, optionally prefixed with a tag type and colon.
	 * @returns {Promise<[Tag, number][]>} Promise that resolves to an array of `[Tag, count]` tuples.
	 * @throws {HitomiError} Thrown when type is invalid.
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