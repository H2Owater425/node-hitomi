import type { Hitomi } from '../hitomi';
import { Image, Video } from './media';
import { Language, Tag } from './tag';
import { Base } from '../internal/structures';

/**
 * Title associated with a gallery.
 * 
 * @see {@link Gallery}
 */
export class Title {
	// @internal
	constructor(
		/**
		 * Display title of the gallery.
		 * 
		 * @type {string}
		 * @readonly
		 */
		public readonly display: string,
		/**
		 * Japanese title of the gallery.
		 * 
		 * @deprecated This field is always null.
		 * @type {string | null}
		 * @readonly
		 */
		public readonly japanese: string | null = null
	) {}
}

/**
 * Reference to a gallery with a unique identifier.
 * 
 * @see {@link Gallery}
 * @see {@link GalleryManager}
 */
export class GalleryReference extends Base {
	constructor(
		hitomi: Hitomi,
		/**
		 * Unique identifier of the gallery.
		 * 
		 * @type {number}
		 * @readonly
		 */
		public readonly id: number
	) {
		super(hitomi);
	}

	/**
	 * Retrieves a full {@link Gallery} associated with the unique identifier.
	 * 
	 * @returns {Promise<Gallery>} Promise that resolves to a full {@link Gallery} instance.
	 */
	public retrieve(): Promise<Gallery> {
		return this['hitomi']['galleries'].retrieve(this['id']);
	}
}

/**
 * Partial gallery for a specific language.
 * 
 * @see {@link Gallery}
 */
export class TranslatedGallery extends GalleryReference {
	// @internal
	constructor(
		hitomi: Hitomi,
		id: GalleryReference['id'],
		/**
		 * Language of the gallery. (`null` if unavailable)
		 * 
		 * @type {Language | null}
		 * @readonly
		 */
		public readonly language: Language | null,
		/**
		 * URL path of the gallery.
		 * 
		 * @type {string}
		 * @readonly
		 */
		public readonly url: string
	) {
		super(hitomi, id);
	}
}

/**
 * Full gallery with metadata, files, and relationships.
 * 
 * @see {@link GalleryManager}
 */
export class Gallery extends TranslatedGallery {
	// @internal
	constructor(
		hitomi: Hitomi,
		id: TranslatedGallery['id'],
		language: TranslatedGallery['language'],
		url: TranslatedGallery['url'],
		/**
		 * Title of the gallery.
		 * 
		 * @type {Title}
		 * @readonly
		 */
		public readonly title: Title,
		/**
		 * Type of the gallery.
		 * 
		 * @type {'doujinshi' | 'manga' | 'artistcg' | 'gamecg' | 'imageset' | 'anime'}
		 * @readonly
		 */
		public readonly type: 'doujinshi' | 'manga' | 'artistcg' | 'gamecg' | 'imageset' | 'anime',
		/**
		 * Artist tags associated with the gallery.
		 * 
		 * @type {readonly Tag[]}
		 * @readonly
		 */
		public readonly artists: readonly Tag[],
		/**
		 * Group tags associated with the gallery.
		 * 
		 * @type {readonly Tag[]}
		 * @readonly
		 */
		public readonly groups: readonly Tag[],
		/**
		 * Series (parody) tags associated with the gallery.
		 * 
		 * @type {readonly Tag[]}
		 * @readonly
		 */
		public readonly series: readonly Tag[],
		/**
		 * Character tags associated with the gallery.
		 * 
		 * @type {readonly Tag[]}
		 * @readonly
		 */
		public readonly characters: readonly Tag[],
		/**
		 * General, male, and female tags associated with the gallery.
		 * 
		 * @type {readonly Tag[]}
		 * @readonly
		 */
		public readonly tags: readonly Tag[],
		/**
		 * Image files in the gallery.
		 * 
		 * @type {readonly Image[]}
		 * @readonly
		 */
		public readonly files: readonly Image[],
		/**
		 * Available translations in other languages.
		 * 
		 * @type {readonly TranslatedGallery[]}
		 * @readonly
		 */
		public readonly translations: readonly TranslatedGallery[],
		/**
		 * References to related galleries.
		 * 
		 * @type {readonly GalleryReference[]}
		 * @readonly
		 */
		public readonly relations: readonly GalleryReference[],
		/**
		 * Whether the gallery is blocked.
		 * 
		 * @type {boolean}
		 * @readonly
		 */
		public readonly isBlocked: boolean,
		/**
		 * Date when the gallery was added.
		 * 
		 * @type {Date}
		 * @readonly
		 */
		public readonly addedDate: Date,
		/**
		 * Date when the original work was published. (`null` if unavailable)
		 * 
		 * @type {Date | null}
		 * @readonly
		 */
		public readonly publishedDate: Date | null = null,
		/**
		 * Video resource associated with the gallery. (`null` if unavailable)
		 * 
		 * @type {Video | null}
		 * @readonly
		 */
		public readonly video: Video | null = null
	) {
		super(hitomi, id, language, url);
	}

	/**
	 * Returns representative thumbnails.
	 * 
	 * @returns {[Image, Image]} Tuple containing the first and middle image.
	 */
	public getThumbnails(): [Image, Image] {
		return [this['files'][0], this['files'][Math.floor(this['files']['length'] / 2)]]
	}
}