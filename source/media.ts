import type { Hitomi } from './hitomi';
import { BASE_DOMAIN, Extension, ThumbnailSize } from './utilities/constants';
import { formatOneOfState, parseNumber } from './utilities/functions';
import { Base, HitomiError } from './utilities/structures';
import type { ImageContext } from './utilities/types';
import type { Gallery } from './gallery';

/**
 * Abstract media class for providing common dimensions.
 *
 * @abstract
 * @see {@link Image}
 * @see {@link Video}
 */
abstract class Media extends Base {
	// @internal
	constructor(
		hitomi: Hitomi,
		/**
		 * The width of the media in pixels.
		 * 
		 * @type {number}
		 * @readonly
		 */
		public readonly width: number,
		/**
		 * The height of the media in pixels.
		 * 
		 * @type {number}
		 * @readonly
		 */
		public readonly height: number
	) {
		super(hitomi);
	}

	// @internal
	protected request(url: string): Promise<Buffer> {
		const index: number = url.indexOf('/', 2);

		return this['hitomi'].request([url.slice(2, index), url.slice(index)]);
	}
}

/**
 * Represents an image associated with a gallery.
 * 
 * @see {@link Gallery}
 */
export class Image extends Media {
	// @internal
	constructor(
		hitomi: Hitomi,
		width: number,
		height: number,
		/**
		 * The unique hash identifying the image.
		 * 
		 * @type {string}
		 * @readonly
		 */
		public readonly hash: string,
		/**
		 * The file name of the image.
		 * 
		 * @type {string}
		 * @readonly
		 */
		public readonly name: string,
		/**
		 * Whether an AVIF extension is available.
		 * 
		 * @type {boolean}
		 * @readonly
		 */
		public readonly hasAvif: boolean,
		/**
		 * Whether a WebP extension is available.
		 * 
		 * @deprecated This field is always true.
		 * @type {boolean}
		 * @readonly
		 */
		public readonly hasWebp: boolean,
		/**
		 * Whether a JPEG XL extension is available.
		 * 
		 * @deprecated This field is always false.
		 * @type {boolean}
		 * @readonly
		 */
		public readonly hasJxl: boolean,
		/**
		 * Whether a specific thumbnail size is available.
		 * 
		 * @type {boolean}
		 * @readonly
		 */
		public readonly hasThumbnail: boolean
	) {
		super(hitomi, width, height);
	}

	/**
	 * Generates a URL of the image with the specified format and optional thumbnail size.
	 *
	 * Not all combinations of extension and thumbnail size are valid:
	 *
	 * | Thumbnail Size | Extension | Requirement (must be true)       |
	 * | :------------- | :-------- | :------------------------------- |
	 * | *(none)*       | *(all)*   | `has{Extension}`                 |
	 * | `Small`        | *(all)*   | `has{Extension}`                 |
	 * | `Medium`       | `Avif`    | `hasThumbnail && has{Extension}` |
	 * | `Big`          | *(all)*   | `hasThumbnail && has{Extension}` |
	 * 
	 * @param {Extension} extension The desired image format.
	 * @param {ThumbnailSize} [thumbnailSize] An optional thumbnail size. (the full-size image URL is returned if omitted)
	 * @returns {Promise<string>} A promise that resolves to a fully resolved image URL.
	 * @throws {HitomiError} If the provided combination of extension and thumbnail size violates the rules above.
	 * @see {@link hasAvif}
	 * @see {@link hasWebp}
	 * @see {@link hasJxl}
	 * @see {@link hasThumbnail}
	 */
	public async createUrl(extension: Extension, thumbnailSize?: ThumbnailSize): Promise<string> {
		if(!extension || !this['has' + String.fromCharCode(extension.charCodeAt(0) - 32) + extension.slice(1) as `has${'Webp' | 'Avif' | 'Jxl'}`]) {
			throw new HitomiError('Extension', 'supported');
		}

		let subdomain: string;
		let path: string;

		if(thumbnailSize) {
			let member: string = 'Big';

			switch(thumbnailSize) {
				case 'smallbig': {
					if(extension !== 'avif') {
						throw new HitomiError('ThumbnailSize.Medium', 'used only with avif');
					}

					member = 'Medium';
				}
				case 'big': {
					if(!this['hasThumbnail']) {
						throw new HitomiError('ThumbnailSize.' + member, 'used only with image that has thumbnail');
					}
				}
				case 'small': {
					break;
				}

				default: {
					// @ts-expect-error
					throw new HitomiError('ThumbnailSize', formatOneOfState(ThumbnailSize));
				}
			}

			subdomain = 'tn';
			path = extension + thumbnailSize + 'tn/' + this['hash'].slice(-1) + '/' + this['hash'].slice(-3, -1) + '/' + this['hash'];
		} else {
			const hashCode: number = parseNumber(this['hash'].slice(-1) + this['hash'].slice(-3, -1), true);
			const context: Readonly<ImageContext> = await this['hitomi']['imageContext'].retrieve();

			subdomain = extension[0] + (1 + ((context[0].has(hashCode) !== context[1]) as unknown as number));
			path = context[2] + hashCode + '/' + this['hash'];
		}

		return '//' + subdomain + '.' + BASE_DOMAIN + '/' + path + '.' + extension;
	}

	/**
	 * Fetches the image with the specified format and optional thumbnail size.
	 *
	 * The same restrictions on extension and thumbnail size combinations apply as in {@link createUrl}.
	 *
	 * @param {Extension} extension The desired image format.
	 * @param {ThumbnailSize} [thumbnailSize] An optional thumbnail size. (the full-size image is returned if omitted)
	 * @returns {Promise<Buffer>} A promise that resolves to the image as a buffer.
	 * @throws {HitomiError} If the provided combination of extension and thumbnail size is invalid.
	 */
	public async fetch(extension: Extension, thumbnailSize?: ThumbnailSize): Promise<Buffer> {
		return super.request(await this.createUrl(extension, thumbnailSize));
	}
}

/**
 * Represents a video associated with a gallery.
 * 
 * @see {@link Gallery}
 */
export class Video extends Media {
	/**
	 * The URL of the video.
	 * 
	 * @type {string}
	 * @readonly
	 */
	public readonly url: string;
	/**
	 * The URL of the poster.
	 *
	 * @type {string}
	 * @readonly
	 */
	public readonly posterUrl: string;

	// @internal
	constructor(
		hitomi: Hitomi,
		width: number,
		height: number,
		/**
		 * The filename of the video.
		 * 
		 * @type {string}
		 * @readonly
		 */
		public readonly fileName: string,
		hash: string
	) {
		super(hitomi, width, height);

		this['url'] = '//streaming.' + BASE_DOMAIN + '/videos/' + fileName;
		this['posterUrl'] = '//a.' + BASE_DOMAIN + '/videos/posters/' + hash.slice(-1) + '/' + hash.slice(-3, -1) + '/' + hash + '.webp';
	}

	/**
	 * Fetches the video.
	 *
	 * @returns {Promise<Buffer>} A promise that resolves to the video as a buffer.
	 */
	public fetch(): Promise<Buffer> {
		return super.request(this['url']);
	}

	/**
	 * Fetches the poster of the video.
	 *
	 * @returns {Promise<Buffer>} A promise that resolves to the poster as a buffer.
	 */
	public fetchPoster(): Promise<Buffer> {
		return super.request(this['posterUrl']);
	}
}