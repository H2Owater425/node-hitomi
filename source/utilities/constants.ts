import type { Gallery } from '../gallery';
import type { Language } from '../tag';

export const BASE_DOMAIN = 'gold-usergeneratedcontent.net' as const;

// @ts-expect-error - typescript internal error
export const RESOURCE_DOMAIN: `ltn.${typeof BASE_DOMAIN}` = 'ltn.' + BASE_DOMAIN;

export const FRONT_DOMAIN = 'hitomi.la' as const;

export const DEFAULT_HEADERS = {
	'accept-encoding': 'gzip',
	connection: 'keep-alive',
	referer: 'https://' + FRONT_DOMAIN
} as const;

export const DEDICATED_TAG_PROPERTIES = ['artist', 'group', 'parody', 'character'] as const;

export const BINARY_ORDERED_LANGUAGES = [
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
] as const;

export const LANGUAGE_NAMES: Set<Language['name']> = new Set<Language['name']>();

for(let i: number = 0; i < BINARY_ORDERED_LANGUAGES['length']; i++) {
	LANGUAGE_NAMES.add(BINARY_ORDERED_LANGUAGES[i][0]);
}

export const GALLERY_TYPES: Set<Gallery['type']> = new Set<Gallery['type']>([
	'doujinshi',
	'manga',
	'artistcg',
	'gamecg',
	'imageset',
	'anime'
]);

/**
 * Specifies the sorting criteria for searching galleries.
 *
 * @enum {string}
 */
export const enum SortType {
	DateAdded = 'added',
	DatePublished = 'published',
	Random = 'random',
	PopularityDay = 'today',
	PopularityWeek = 'week',
	PopularityMonth = 'month',
	PopularityYear = 'year'
}

/**
 * Specifies the initial character used for filtering tags.
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
	_123 = '123'
}

/**
 * Specifies the image file format to use when requesting images.
 *
 * @enum {string}
 */
export const enum Extension {
	Avif = 'avif',
	Webp = 'webp',
	Jxl = 'jxl'
}

/**
 * Specifies the thumbnail size for gallery image previews.
 *
 * @enum {string}
 */
export const enum ThumbnailSize {
	Small = 'small',
	Medium = 'smallbig',
	Big = 'big'
}