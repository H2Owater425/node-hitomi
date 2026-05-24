/**
 * Sorting options for listing galleries.
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
 * Supported image formats for retrieving images.
 *
 * @enum {string}
 */
export const enum Extension {
	Avif = 'avif',
	Webp = 'webp',
	Jxl = 'jxl'
}

/**
 * Supported thumbnail sizes for retrieving images.
 *
 * @enum {string}
 */
export const enum ThumbnailSize {
	Small = 'small',
	Medium = 'smallbig',
	Big = 'big'
}