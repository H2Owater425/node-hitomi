import type { Hitomi } from '../hitomi';
import { Image, Video } from './media';
import { Language, type Tag } from './tag';
import { Base } from '../internal/base';

/**
 * A title associated with a gallery.
 *
 * @see {@link Gallery}
 */
export class Title {
	// @internal
	constructor(
		/**
		 * The display title of the gallery.
		 *
		 * @type {string}
		 * @readonly
		 */
		public readonly display: string,
		/**
		 * The Japanese title of the gallery.
		 *
		 * @deprecated Always `null`.
		 * @type {string | null}
		 * @readonly
		 */
		public readonly japanese: string | null = null
	) {}
}

/**
 * A lightweight reference to a gallery by its unique identifier.
 *
 * @see {@link Gallery}
 * @see {@link GalleryManager}
 */
export class GalleryReference extends Base {
	// @internal
	constructor(
		hitomi: Hitomi,
		/**
		 * The unique identifier of the gallery.
		 *
		 * @type {number}
		 * @readonly
		 */
		public readonly id: number
	) {
		super(hitomi);
	}

	/**
	 * Retrieves the full gallery for this reference.
	 *
	 * @returns {Promise<Gallery>} A `Promise` that resolves to the full gallery.
	 * @see {@link Gallery}
	 */
	public retrieve(): Promise<Gallery> {
		return this['hitomi']['galleries'].retrieve(this['id']);
	}
}

/**
 * A translated gallery reference for a specific language.
 *
 * @extends {Gallery}
 * @see {@link Gallery}
 */
export class TranslatedGallery extends GalleryReference {
	// @internal
	constructor(
		hitomi: Hitomi,
		id: GalleryReference['id'],
		/**
		 * The language of the translated gallery, or `null` if unavailable.
		 *
		 * @type {Language | null}
		 * @readonly
		 * @see {@link Language}
		 */
		public readonly language: Language | null,
		/**
		 * The URL path of the gallery.
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
 * A complete gallery including metadata, media files, and relationships.
 *
 * @extends {TranslatedGallery}
 * @see {@link GalleryManager}
 */
export class Gallery extends TranslatedGallery {
	// @internal
	public static readonly TYPES: Set<Gallery['type']> = new Set<Gallery['type']>([
		'doujinshi',
		'manga',
		'artistcg',
		'gamecg',
		'imageset',
		'anime'
	]);

	// @internal
	constructor(
		hitomi: Hitomi,
		id: TranslatedGallery['id'],
		language: TranslatedGallery['language'],
		url: TranslatedGallery['url'],
		/**
		 * The title of the gallery.
		 *
		 * @type {Title}
		 * @readonly
		 * @see {@link Title}
		 */
		public readonly title: Title,
		/**
		 * The type of the gallery.
		 *
		 * @type {'doujinshi' | 'manga' | 'artistcg' | 'gamecg' | 'imageset' | 'anime'}
		 * @readonly
		 */
		public readonly type: 'doujinshi' | 'manga' | 'artistcg' | 'gamecg' | 'imageset' | 'anime',
		/**
		 * Artist tags associated with the gallery.
		 *
		 * @type {Tag[]}
		 * @readonly
		 * @see {@link Tag}
		 */
		public readonly artists: readonly Tag[],
		/**
		 * Group tags associated with the gallery.
		 *
		 * @type {Tag[]}
		 * @readonly
		 * @see {@link Tag}
		 */
		public readonly groups: readonly Tag[],
		/**
		 * Series (parody) tags associated with the gallery.
		 *
		 * @type {Tag[]}
		 * @readonly
		 * @see {@link Tag}
		 */
		public readonly series: readonly Tag[],
		/**
		 * Character tags associated with the gallery.
		 *
		 * @type {Tag[]}
		 * @readonly
		 * @see {@link Tag}
		 */
		public readonly characters: readonly Tag[],
		/**
		 * General, male, and female tags associated with the gallery.
		 *
		 * @type {Tag[]}
		 * @readonly
		 * @see {@link Tag}
		 */
		public readonly tags: readonly Tag[],
		/**
		 * The image files in the gallery.
		 *
		 * @type {Image[]}
		 * @readonly
		 * @see {@link Image}
		 */
		public readonly files: readonly Image[],
		/**
		 * Available translations in other languages.
		 *
		 * @type {TranslatedGallery[]}
		 * @readonly
		 * @see {@link TranslatedGallery}
		 */
		public readonly translations: readonly TranslatedGallery[],
		/**
		 * References to related galleries.
		 *
		 * @type {GalleryReference[]}
		 * @readonly
		 * @see {@link GalleryReference}
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
		 * The date when the gallery was added.
		 *
		 * @type {Date}
		 * @readonly
		 */
		public readonly addedDate: Date,
		/**
		 * The date when the original work was published, or `null` if unavailable.
		 *
		 * @type {Date | null}
		 * @readonly
		 */
		public readonly publishedDate: Date | null = null,
		/**
		 * The video resource associated with the gallery, or `null` if unavailable.
		 *
		 * @type {Video | null}
		 * @readonly
		 * @see {@link Video}
		 */
		public readonly video: Video | null = null
	) {
		super(hitomi, id, language, url);
	}

	/**
	 * Returns a pair of representative thumbnail images.
	 *
	 * @returns {[Image, Image]} A tuple of the first and middle images from the gallery.
	 * @see {@link Image}
	 */
	public getThumbnails(): [Image, Image] {
		return [this['files'][0], this['files'][Math.floor(this['files']['length'] / 2)]]
	}
}