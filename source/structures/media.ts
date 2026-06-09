import type { Hitomi } from '../hitomi';
import { BASE_DOMAIN } from '../internal/constants';
import { capitalize } from '../internal/functions';
import { Base } from '../internal/base';
import { ErrorCode, HitomiError } from './error';
import type { ImageContext } from '../internal/types';
import type { Gallery } from './gallery';
import { ResponseType } from '@platform';

/**
 * Supported image file formats.
 *
 * @enum {string}
 * @readonly
 */
export enum Extension {
	Avif = 'avif',
	Webp = 'webp',
	Jxl = 'jxl'
}

/**
 * Available thumbnail size presets.
 *
 * @enum {string}
 * @readonly
 */
export enum ThumbnailSize {
	Small = 'small',
	Medium = 'smallbig',
	Big = 'big'
}

/**
 * An abstract base class for media resources with shared dimension properties.
 *
 * @abstract
 * @see {@link Image}
 * @see {@link Video}
 */
abstract class Media extends Base {
	// @internal - Reference real_full_path_from_hash in common.js
	protected static createHashPath(hash: string, separator: string = '/'): string {
		return hash.slice(-1) + separator + hash.slice(-3, -1);
	}

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
	protected request(url: string): Promise<Uint8Array> {
		const index: number = url.indexOf('/', 2);

		return this['hitomi'].request(url.slice(2, index), url.slice(index), ResponseType['BYTE']);
	}
}

/**
 * An image file belonging to a gallery.
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
		 * The original filename of the image.
		 *
		 * @type {string}
		 * @readonly
		 */
		public readonly name: string,
		/**
		 * Whether this image is available in AVIF format.
		 *
		 * @type {boolean}
		 * @readonly
		 */
		public readonly hasAvif: boolean,
		/**
		 * Whether this image is available in WebP format.
		 *
		 * @deprecated Always `true`.
		 * @type {boolean}
		 * @readonly
		 */
		public readonly hasWebp: boolean,
		/**
		 * Whether this image is available in JPEG XL format.
		 *
		 * @deprecated Always `false`.
		 * @type {boolean}
		 * @readonly
		 */
		public readonly hasJxl: boolean,
		/**
		 * Whether thumbnail variants are available for this image.
		 *
		 * @type {boolean}
		 * @readonly
		 */
		public readonly hasThumbnail: boolean
	) {
		super(hitomi, width, height);
	}

	/**
	 * Resolves a URL for this image in the specified format, optionally using a thumbnail size.
	 *
	 * Only the following combinations are valid:
	 *
	 * | Thumbnail Size | Extension | Requirement (must be `true`)     |
	 * | :------------- | :-------- | :------------------------------- |
	 * | *(none)*       | *(all)*   | `has{Extension}`                 |
	 * | `Small`        | *(all)*   | `has{Extension}`                 |
	 * | `Medium`       | `Avif`    | `hasThumbnail && has{Extension}` |
	 * | `Big`          | *(all)*   | `hasThumbnail && has{Extension}` |
	 *
	 * @param {Extension} extension The desired image format.
	 * @param {ThumbnailSize} [thumbnailSize] The thumbnail size preset. Omit for a full-size image URL.
	 * @returns {Promise<string>} A `Promise` that resolves to the image URL.
	 * @throws {HitomiError} If the `extension` and `thumbnailSize` combination is invalid.
	 * @see {@link Extension}
	 * @see {@link ThumbnailSize}
	 * @see {@link Image.hasAvif}
	 * @see {@link Image.hasWebp}
	 * @see {@link Image.hasJxl}
	 * @see {@link Image.hasThumbnail}
	 */
	public async resolveUrl(extension: Extension, thumbnailSize?: ThumbnailSize): Promise<string> {
		// @ts-expect-error - Typescript internal error
		if(!extension || !this['has' + capitalize(extension)]) {
			throw new HitomiError(ErrorCode['InvalidCombination'], 'Extension', 'supported');
		}

		let subdomain: string;
		let path: string;

		if(thumbnailSize) {
			let member: keyof typeof ThumbnailSize = 'Big';

			switch(thumbnailSize) {
				case ThumbnailSize['Medium']: {
					if(extension !== Extension['Avif']) {
						throw new HitomiError(ErrorCode['InvalidCombination'], 'ThumbnailSize.Medium', 'used only with avif');
					}

					member = 'Medium';
				}
				case ThumbnailSize['Big']: {
					if(!this['hasThumbnail']) {
						throw new HitomiError(ErrorCode['InvalidCombination'], 'ThumbnailSize.' + member, 'used only with image that has thumbnail');
					}
				}
				case ThumbnailSize['Small']: {
					break;
				}

				default: {
					// @ts-expect-error
					throw HitomiError.invalidMember('ThumbnailSize', ThumbnailSize);
				}
			}

			subdomain = 'tn';
			path = extension + thumbnailSize + 'tn/' + Media.createHashPath(this['hash']) + '/' + this['hash'];
		} else {
			const hashCode: number = Number.parseInt(Media.createHashPath(this['hash'], ''), 16);
			const context: ImageContext = await this['hitomi']['imageContext'].retrieve();

			subdomain = extension[0] + (context[0].has(hashCode) === context[1] /* nxor */ ? '2' : '1');
			path = context[2] + hashCode + '/' + this['hash'];
		}

		return '//' + subdomain + '.' + BASE_DOMAIN + '/' + path + '.' + extension;
	}

	/**
	 * Fetches the image in the specified format and optional thumbnail size.
	 *
	 * The same `extension` and `thumbnailSize` restrictions as {@link Image.resolveUrl} apply.
	 *
	 * @param {Extension} extension The desired image format.
	 * @param {ThumbnailSize} [thumbnailSize] The thumbnail size preset. Omit for a full-size image.
	 * @returns {Promise<Uint8Array>} A `Promise` that resolves to the image as a `Uint8Array`.
	 * @throws {HitomiError} If the `extension` and `thumbnailSize` combination is invalid.
	 * @see {@link Extension}
	 * @see {@link ThumbnailSize}
	 */
	public async fetch(extension: Extension, thumbnailSize?: ThumbnailSize): Promise<Uint8Array> {
		return super.request(await this.resolveUrl(extension, thumbnailSize));
	}
}

/**
 * A video file belonging to a gallery.
 *
 * @see {@link Gallery}
 */
export class Video extends Media {
	/**
	 * The streaming URL of the video.
	 *
	 * @type {string}
	 * @readonly
	 */
	public readonly url: string;
	/**
	 * The URL of the poster (video thumbnail).
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
		 * The file name of the video.
		 *
		 * @type {string}
		 * @readonly
		 */
		public readonly fileName: string,
		hash: string
	) {
		super(hitomi, width, height);

		this['url'] = '//streaming.' + BASE_DOMAIN + '/videos/' + fileName;
		this['posterUrl'] = '//a.' + BASE_DOMAIN + '/videos/posters/' + Media.createHashPath(hash) + '/' + hash + '.webp';
	}

	/**
	 * Fetches the video in MP4 format.
	 *
	 * @returns {Promise<Uint8Array>} A `Promise` that resolves to the video as a `Uint8Array`.
	 */
	public fetch(): Promise<Uint8Array> {
		return super.request(this['url']);
	}

	/**
	 * Fetches the poster (video thumbnail) in WebP format.
	 *
	 * @returns {Promise<Uint8Array>} A `Promise` that resolves to the poster as a `Uint8Array`.
	 */
	public fetchPoster(): Promise<Uint8Array> {
		return super.request(this['posterUrl']);
	}
}