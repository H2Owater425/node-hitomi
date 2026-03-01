import type { Hitomi } from './hitomi';
import { BASE_DOMAIN, Extension, ThumbnailSize } from './utilities/constants';
import { formatOneOfState } from './utilities/functions';
import { Base, HitomiError } from './utilities/structures';
import type { ImageContext } from './utilities/types';
import type { Gallery } from './gallery';

/**
 * Abstract base class for media resources providing shared dimensions.
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
		 * Width of the media in pixels.
		 * 
		 * @type {number}
		 * @readonly
		 */
		public readonly width: number,
		/**
		 * Height of the media in pixels.
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
 * Image belonging to a gallery.
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
		 * Unique hash that identifies the image.
		 * 
		 * @type {string}
		 * @readonly
		 */
		public readonly hash: string,
		/**
		 * Original file name of the image.
		 * 
		 * @type {string}
		 * @readonly
		 */
		public readonly name: string,
		/**
		 * Whether the AVIF format is available.
		 * 
		 * @type {boolean}
		 * @readonly
		 */
		public readonly hasAvif: boolean,
		/**
		 * Whether the WebP format is available.
		 * 
		 * @deprecated This field is always true.
		 * @type {boolean}
		 * @readonly
		 */
		public readonly hasWebp: boolean,
		/**
		 * Whether the JPEG XL format is available.
		 * 
		 * @deprecated This field is always false.
		 * @type {boolean}
		 * @readonly
		 */
		public readonly hasJxl: boolean,
		/**
		 * Whether thumbnail variants are available for the image.
		 * 
		 * @type {boolean}
		 * @readonly
		 */
		public readonly hasThumbnail: boolean
	) {
		super(hitomi, width, height);
	}

	/**
	 * Resolves an image URL for the specified format and optional thumbnail size.
	 *
	 * Only the combinations listed below are valid:
	 *
	 * | Thumbnail Size | Extension | Requirement (must be true)       |
	 * | :------------- | :-------- | :------------------------------- |
	 * | *(none)*       | *(all)*   | `has{Extension}`                 |
	 * | `Small`        | *(all)*   | `has{Extension}`                 |
	 * | `Medium`       | `Avif`    | `hasThumbnail && has{Extension}` |
	 * | `Big`          | *(all)*   | `hasThumbnail && has{Extension}` |
	 * 
	 * @param {Extension} extension Desired image format.
	 * @param {ThumbnailSize} [thumbnailSize] Optional thumbnail size. (a full-size image URL is returned if omitted)
	 * @returns {Promise<string>} Promise that resolves to the final image URL.
	 * @throws {HitomiError} Thrown when the `extension` and `thumbnailSize` combination is not valid.
	 * @see {@link hasAvif}
	 * @see {@link hasWebp}
	 * @see {@link hasJxl}
	 * @see {@link hasThumbnail}
	 */
	public async resolveUrl(extension: Extension, thumbnailSize?: ThumbnailSize): Promise<string> {
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
			const hashCode: number = Number.parseInt(this['hash'].slice(-1) + this['hash'].slice(-3, -1), 16);
			const context: ImageContext = await this['hitomi']['imageContext'].retrieve();

			subdomain = extension[0] + (context[0].has(hashCode) === context[1] /* nxor */ ? '2' : '1');
			path = context[2] + hashCode + '/' + this['hash'];
		}

		return '//' + subdomain + '.' + BASE_DOMAIN + '/' + path + '.' + extension;
	}

	/**
	 * Fetches the image with the specified format and optional thumbnail size.
	 *
	 * The same `extension` and `thumbnailSize` restrictions as {@link resolveUrl} apply.
	 *
	 * @param {Extension} extension Desired image format.
	 * @param {ThumbnailSize} [thumbnailSize] Optional thumbnail size. (a full-size image is returned if omitted)
	 * @returns {Promise<Buffer>} Promise that resolves to the image as a `Buffer`.
	 * @throws {HitomiError} Thrown when the `extension` and `thumbnailSize` combination is not valid.
	 */
	public async fetch(extension: Extension, thumbnailSize?: ThumbnailSize): Promise<Buffer> {
		return super.request(await this.resolveUrl(extension, thumbnailSize));
	}
}

/**
 * Video belonging to a gallery.
 * 
 * @see {@link Gallery}
 */
export class Video extends Media {
	/**
	 * URL of the video.
	 * 
	 * @type {string}
	 * @readonly
	 */
	public readonly url: string;
	/**
	 * URL of the poster (video thumbnail).
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
		 * File name of the video.
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
	 * Fetches the video in MP4 format.
	 *
	 * @returns {Promise<Buffer>} Promise that resolves to the video as a `Buffer`.
	 */
	public fetch(): Promise<Buffer> {
		return super.request(this['url']);
	}

	/**
	 * Fetches the poster (video thumbnail) in WebP format.
	 *
	 * @returns {Promise<Buffer>} Promise that resolves to the poster as a `Buffer`.
	 */
	public fetchPoster(): Promise<Buffer> {
		return super.request(this['posterUrl']);
	}
}
