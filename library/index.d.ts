export as namespace hitomi;

export declare interface Image {
    index: number;
    hash: string;
    extension: 'jpg' | 'png';
    hasAvif: boolean;
    hasWebp: boolean;
    width: number;
    height: number;
}

export declare type TagType = 'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag';

export declare interface Tag {
    type: TagType;
    name: string;
    isNegative?: boolean;
}

export declare interface Gallery {
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
    artistList: string[];
    groupList: string[];
    seriesList: string[];
    characterList: string[];
    tagList: Tag[];
    fileList: Image[];
    publishedDate: Date;
}

export declare type OrderCriteria = 'index' | 'popularity';

export declare type StartingCharacter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | '123';

/**
 * Returns gallery data from hitomi from id
 * @param  {number} id
 * @param  {Object} [option]
 * @param  {boolean} [option.includeFullData=true] If set to false, the function will not return gallery data including artists, groups, series, characters
 * @param  {boolean} [option.includeFiles=true] If set to false, the function will not return gallery data including of files
 * @returns {Promise<Gallery>} Promise
 */
export declare function getGalleryData(id: number, option?: { includeFullData?: boolean; includeFiles?: boolean; }): Promise<Gallery>;

/**
 * Returns gallery id list from hitomi from range
 * @param  {Object} range
 * @param  {number} range.startIndex
 * @param  {number} [range.endIndex] If not set, the funtion will return list cotains every id
 * @param  {Object} [option]
 * @param  {OrderCriteria} [option.orderBy='index'] If set to 'popularity', the function will return id list order by popularity
 * @param  {boolean} [option.reverseResult=false] If set to true, the function will return reversed id list
 * @returns {Promise<number[]>} Promise
 */
export declare function getGalleryIdList(range: { startIndex: number; endIndex?: number; }, option?: { orderBy?: OrderCriteria; reverseResult?: boolean; }): Promise<number[]>;

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
 * Returns tag list starting with specific character
 * @param  {TagType} type
 * @param  {StartingCharacter} [startingCharacter] If set and type isn't language, the function will return list of tag that starts with that character
 * @returns Promise
 */
export declare function getTagList(type: TagType, startingCharacter?: StartingCharacter): Promise<Tag[]>;

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
 * @param  {Object} [option]
 * @param  {OrderCriteria} [option.orderBy='index'] If set to 'popularity', the function will return nozomi url that responses data order by popularity
 * @returns {string} string
 */
export declare function getNozomiUrl(tag: Tag, option?: { orderBy?: OrderCriteria; }): string;

/**
 * Returns tag list url with specific character
 * @param  {TagType} type
 * @param  {StartingCharacter} [startingCharacter] If set and type isn't language, the function will return hitomi url that responses data that starts with that character
 * @returns string
 */
export declare function getTagUrl(type: TagType, startingCharacter?: StartingCharacter): string;

export default {
	getGalleryData: getGalleryData,
	getGalleryIdList: getGalleryIdList,
	parseTag: parseTag,
	queryTag: queryTag,
	getTagList: getTagList,
	getImageUrl: getImageUrl,
	getGalleryUrl: getGalleryUrl,
	getNozomiUrl: getNozomiUrl,
	getTagUrl: getTagUrl
};