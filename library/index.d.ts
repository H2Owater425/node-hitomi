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

	interface Tag {
		type: 'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag';
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
		artists: string[];
		groups: string[];
		series: string[];
		characters: string[];
		tags: Tag[];
		files: Image[];
		publishedDate: Date;
		translations: Pick<Gallery, 'id' | 'languageName'>[];
		relatedIds: number[];
	}

	type PopularityPeriod = 'day' | 'week' | 'month' | 'year';

	type StartingCharacter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | '0-9';

	/**
	 * Resolves url of image
	 * @class
	 */
	class ImageUrlResolver {
		/**
		 * Synchronize data with Hitomi
		 * @public
		 * @returns {Promise<ImageUrlResolver>}
		 */
		public synchronize(): Promise<ImageUrlResolver>;

		/**
		 * Returns url of image
		 * @public
		 * @param  {Image} image
		 * @param  {'avif' | 'webp'} extension
		 * @param  {object} [options = {}]
		 * @param  {boolean} [options.isThumbnail = false] If set to true, the function will return thumbnail url
		 * @param  {boolean} [options.isSmall = false] If set to true and extension is avif and options.isThumbnail is true, the function will return small thumbnail url
		 * @returns {string}
		 */
		public getImageUrl(image: Image, extension: 'avif' | 'webp', options: { isThumbnail?: boolean; isSmall?: boolean; }): string;
	}

	/**
	 * Returns url of nozomi
	 * @param  {object} [options = {}]
	 * @param  {Tag} [options.tag]
	 * @param  {PopularityPeriod} [options.orderByPopularityPeriod] If not set, the function will return ids order by index
	 * @returns {string}
	 */
	function getNozomiUrl(options: { tag?: Tag, orderByPopularityPeriod?: PopularityPeriod; }): string;

	/**
	* Returns url of tags
	* @param  {Tag['type']} type
	* @param  {object} [option = {}]
	* @param  {StartingCharacter} [option.startWith] If set and type isn't language nor type, the function will return hitomi url that responds tag that starts with that character
	* @returns {string}
	*/
	function getTagUrl(type: Tag['type'], options: { startWith?: StartingCharacter }): string;

	/**
	 * Returns url of video from gallery
	 * @param  {Gallery} gallery
	 * @returns {string}
	 */
	function getVideoUrl(gallery: Gallery): string;

	/**
	 * Returns url of gallery
	 * @param  {Gallery} gallery
	 * @returns {string}
	 */
	function getGalleryUrl(gallery: Gallery): string;

	/**
	 * Returns index of second thumbnail from gallery
	 * @param  {Gallery} gallery
	 * @returns {number}
	 */
	function getSecondThumbnailIndex(gallery: Gallery): number;

	/**
	 * Returns gallery from id
	 * @param  {number} id
	 * @param  {object} [options = {}]
	 * @param  {boolean} [options.includeFiles = true] If set to false, the function will not return gallery including files
	 * @param  {boolean} [options.includeRelatedIds = false] If set to true, the function will return gallery including related ids
	 * @returns {Promise<Gallery>}
	 */
	function getGallery(id: number, options: { includeFiles?: boolean; includeRelatedIds?: boolean }): Promise<Gallery>;

	/**
	 * Returns ids
	 * @param  {object} [options = {}]
	 * @param  {Tag[]} [options.tags = []]
	 * @param  {object} [options.range]
	 * @param  {number} [options.range.startIndex = 0]
	 * @param  {number} [options.range.endIndex] If not set, the function will return whole range from startIndex
	 * @param  {PopularityPeriod} [options.orderByPopularityPeriod] If not set, the function will return ids order by index
	 * @param  {boolean} [options.reverseResult = false] If set to true, the function will return reversed ids
	 * @returns {Promise<number[]>}
	 */
	function getIds(options: { tags?: Tag[], range?: { startIndex?: number; endIndex?: number; }, orderByPopularityPeriod?: PopularityPeriod, reverseResult?: boolean; }): Promise<number[]>;

	/**
	 * Returns tags from string
	 * @param {string} tagString 
	 */
	function getParsedTags(tagString: string): Tag[]

	/**
	 * Returns tags from type
	 * @param  {Tag['type']} type
	 * @param  {object} [options = {}]
	 * @param  {StartingCharacter} [options.startWith] If set and type isn't language nor type, the function will return tags that responds tag that starts with that character
	 * @returns {Promise<Tag[]>}
	 */
	function getTags(type: Tag['type'], options: { startWith?: StartingCharacter }): Promise<Tag[]>;
}

export default hitomi;