declare module hitomi {
	interface Image {
			index: number;
			hash: string;
			extension: 'jpg' | 'png' | 'gif';
			hasAvif: boolean;
			hasWebp: boolean;
			width: number;
			height: number;
	}

	type TagType = 'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag';

	interface Tag {
			type: TagType;
			name: string;
			isNegative?: boolean;
	}

	interface Gallery {
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

	type OrderCriteria = 'index' | 'popularity';

	type StartingCharacter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | '123';

	/**
	 * Returns image url from an image
	 * @param  {Image} image
	 * @param  {'jpg'|'png'|'avif'|'webp'} extension
	 * @param  {Object} [option]
	 * @param  {boolean} [option.isThumbnail=false] If set to true, the function will return thumbnail url
	 * @returns {string}
	 */
	export function getImageUrl(image: Image, extension: 'jpg' | 'png' | 'avif' | 'webp', option?: { isThumbnail?: boolean; }): string;

	/**
	 * Returns video url from gallery
	 * @param  {Gallery} gallery
	 * @returns {string}
	 */
	export function getVideoUrl(gallery: Gallery): string;

	/**
	 * Returns gallery url from gallery
	 * @param  {Gallery} gallery
	 * @returns {string}
	 */
	export function getGalleryUrl(gallery: Gallery): string;

	/**
	 * Returns nozomi url from tag
	 * @param  {Tag} tag
	 * @param  {Object} [option]
	 * @param  {OrderCriteria} [option.orderBy='index'] If set to 'popularity', the function will return nozomi url that responds id-data order by popularity
	 * @returns {string}
	 */
	export function getnozomiUrl(tag: Tag, option?: { orderBy?: OrderCriteria; }): string;

	/**
	 * Returns tag list url with specific character
	 * @param  {TagType} type
	 * @param  {Object} [option]
	 * @param  {StartingCharacter} [option.startWith] If set and type isn't language nor type, the function will return hitomi url that responds tag-data that starts with that character
	 * @returns {string}
	 */
	export function getTagUrl(type: TagType, option: { startWith: StartingCharacter }): string

	/**
	 * Returns gallery from hitomi from id
	 * @param  {number} id
	 * @param  {Object} [option]
	 * @param  {boolean} [option.includeFullData=true] If set to false, the function will not return gallery data including artists, groups, series, characters
	 * @param  {boolean} [option.includeFiles=true] If set to false, the function will not return gallery data including files
	 * @returns {Promise<Gallery>}
	 */
	export function getGallery(id: number, option?: { includeFullData?: boolean; includeFiles?: boolean; }): Promise<Gallery>;

	/**
	 * Returns id list from hitomi from range
	 * @param  {Object} range
	 * @param  {number} range.startIndex
	 * @param  {number} [range.endIndex] If not set, the function will return a list contains every id
	 * @param  {Object} [option]
	 * @param  {OrderCriteria} [option.orderBy='index'] If set to 'popularity', the function will return id list ordered by popularity
	 * @param  {boolean} [option.reverseResult=false] If set to true, the function will return reversed id list
	 * @returns {Promise<number[]>}
	 */
	export function getIdList(range: { startIndex: number; endIndex?: number; }, option?: { orderBy?: OrderCriteria; reverseResult?: boolean; }): Promise<number[]>;

	/**
	 * Returns tag list from string
	 * @param  {string} tagString
	 * @returns {Tag[]}
	 */
	export function getParsedTagList(tagString: string): Tag[];

	/**
	 * Returns gallery id list from tag list
	 * @param  {Tag[]} tagList
	 * @returns {Promise<number[]>}
	 */
	export function getQueriedIdList(tagList: Tag[]): Promise<number[]>;

	/**
	 * Returns tag list starting with specific character
	 * @param  {TagType} type
	 * @param  {object} [option]
	 * @param  {StartingCharacter} [option.startWith] If set and type isn't language nor type, the function will return tag list that responds tag-data that starts with that character
	 * @returns {Promise<Tag[]>}
	 */
	export function getTagList(type: TagType, option?: { startWith?: StartingCharacter }): Promise<Tag[]>;
}

export default hitomi;