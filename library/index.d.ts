export as namespace hitomi;

export interface Tag {
	type: 'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag';
	name: string;
	isNegative?: boolean;
}

export interface Image {
	index: number;
	hash: string;
	extension: 'jpg' | 'png';
	hasAvif: boolean;
	hasWebp: boolean;
	width: number;
	height: number;
}

export interface Gallery {
	id: number;
	title: string;
	titleJapanese: string | null;
	type: 'doujinshi' | 'manga' | 'artistcg' | 'gamecg';
	language: string | null;
	languageLocalName: string | null;
	artists: string[];
	groups: string[];
	series: string[];
	characters: string[];
	tags: Tag[];
	files: Image[] | null;
	publishedDate: Date;
}

/**
 * Returns gallery data from hitomi from id
 * @param  {number} id
 * @param  {Object} [option]
 * @param  {boolean} [option.includeFullData=true] If set to false, the function will not return data including artists, groups, series, characters
 * @param  {boolean} [option.includeFiles=true] If set to false, the function will not return data including of files
 * @returns {Promise<Gallery>} Promise
 */
export declare function getGalleryData(id: number, option?: { includeFullData?: boolean; includeFiles?: boolean; }): Promise<Gallery>;

/**
 * Returns gallery id list from hitomi from range
 * @param  {Object} range
 * @param  {number} range.startIndex
 * @param  {number} [range.endIndex=range.startIndex+1]
 * @param  {Object} [option]
 * @param  {boolean} [option.reverse=false] If set to true, the function will return reversed list
 * @returns {Promise<number[]>} Promise
 */
export declare function getGalleryIdList(range: { startIndex: number; endIndex?: number; }, option?: { reverse?: boolean; }): Promise<number[]>;

/**
 * Returns tag list from string
 * @param  {string} tagString
 * @returns {Tag[]} Tag
 */
export declare function parseTag(tagString: string): Tag[];

/**
 * Returns gallery id list from tag list
 * @param  {Tag[]} tagList
 * @returns {Promise<number[]>} Promise
 */
export declare function queryTag(tagList: Tag[]): Promise<number[]>;

/**
 * Returns image url from image 
 * @param  {Image} imageData
 * @param  {'jpg'|'png'|'avif'|'webp'} extension
 * @param  {Object} [option]
 * @param  {boolean} [option.isThumbnail=false] If set to true, the function will return thumbnail url
 * @returns {string} string
 */
export declare function getImageUrl(imageData: Image, extension: 'jpg' | 'png' | 'avif' | 'webp', option?: { isThumbnail?: boolean; }): string;

/**
 * Returns gallery url from gallery
 * @param  {Gallery} galleryData
 * @returns {string} string
 */
export declare function getGalleryUrl(galleryData: Gallery): string;

/**
 * Returns nozomi url from tag
 * @param  {Tag} tag
 * @returns {string} string
 */
export declare function getNozomiUrl(tag: Tag): string;