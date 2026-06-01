import type { ImageContext } from './internal/types';
import { GalleryManager } from './managers/gallery';
import { TagManager } from './managers/tag';
import { DEFAULT_HEADERS, RESOURCE_DOMAIN, MAXIMUM_AGE_PROPERTIES } from './internal/constants';
import { defineProperties, capitalize } from './internal/functions';
import { Provider, IndexProvider } from './internal/provider';
import { ErrorCode, HitomiError } from './structures/error';
import { request, type RequestFunction, hash, type HashFunction, ResponseType, toString, RequestContext, OnRequestFunction } from '@platform';

/**
 * Options for creating a {@link Hitomi} client.
 *
 * @template T The platform-specific request options type.
 * @see {@link Hitomi}
 */
export interface HitomiOptions<T = any> {
	/**
	 * A custom HTTPS agent for connection pooling.
	 *
	 * @default new Agent({ keepAlive: true })
	 * @deprecated Use {@link onRequest} instead. This option takes precedence over `onRequest` when set. Will be removed in v10.
	 */
	agent?: unknown;
	/**
	 * A custom function for making HTTPS requests.
	 */
	request?: RequestFunction;
	/**
	 * A hook function invoked before each HTTP request.
	 */
	onRequest?: OnRequestFunction<T>;
	/**
	 * A custom function for computing SHA-256 hashes.
	 */
	hash?: HashFunction;
	/**
	 * Maximum age in milliseconds, before the cached index version is refreshed.
	 *
	 * @default 600000
	 */
	indexMaximumAge?: number;
	/**
	 * Maximum age in milliseconds, before the cached image URL context is refreshed.
	 *
	 * @default 3600000
	 */
	imageContextMaximumAge?: number;
}

/**
 * A client for interacting with the Hitomi API.
 */
export class Hitomi {
	/**
	 * A manager for retrieving and listing galleries.
	 *
	 * @type {GalleryManager}
	 * @readonly
	 */
	public readonly galleries: GalleryManager;
	/**
	 * A manager for creating, parsing, searching, and listing tags.
	 *
	 * @type {TagManager}
	 * @readonly
	 */
	public readonly tags: TagManager;

	// @internal
	public onRequest!: OnRequestFunction;
	// @internal
	public request!: ((host: string, path: string, type: ResponseType.BYTE, range?: string) => Promise<Uint8Array>) &
		((host: string, path: string, type: ResponseType.VIEW, range?: string) => Promise<DataView>) &
		((host: string, path: string, type: ResponseType.TEXT, range?: string) => Promise<string>) &
		((host: string, path: string, type: ResponseType.JSON, range?: string) => Promise<unknown>);
	// @internal
	public hash!: HashFunction;
	// @internal
	public readonly indexMaximumAge!: number;
	// @internal
	public readonly languageIndex!: IndexProvider;
	// @internal
	public readonly imageContext!: Provider<ImageContext>;

	/**
	 * Creates a new Hitomi client.
	 *
	 * @param {HitomiOptions} [options] The configuration options for the client.
	 * @throws {HitomiError} If `options.indexMaximumAge` or `options.imageContextMaximumAge` is provided as a negative integer.
	 */
	constructor(options: HitomiOptions = {}) {
		for(let i: number = 0; i < MAXIMUM_AGE_PROPERTIES['length']; i++) {
			if(options[MAXIMUM_AGE_PROPERTIES[i]] && (!Number.isInteger(options[MAXIMUM_AGE_PROPERTIES[i]]) || options[MAXIMUM_AGE_PROPERTIES[i]] as number < 0)) {
				throw new HitomiError(ErrorCode['InvalidArgument'], capitalize(MAXIMUM_AGE_PROPERTIES[i]), 'a non-negative integer');
			}
		}

		// Options might be modified
		const optionsRequest: RequestFunction | undefined = options['request'];
		const optionsOnRequest: OnRequestFunction | undefined = options['agent'] ? function (context: RequestContext): RequestContext {
			// @ts-ignore
			context['options']['agent'] = options['agent'];

			return context;
		} : options['onRequest'];
		const optionsHash: HashFunction | undefined = options['hash'];

		defineProperties(this, {
			request: optionsRequest ? async function (host: string, path: string, type: ResponseType, range?: string): Promise<Uint8Array | DataView | string | unknown> {
				const buffer: Uint8Array = await optionsRequest(host, path, Object.assign<Record<string, string>, Record<string, string>>(range ? {
					range: 'bytes=' + range
				} : {
					'accept-encoding': 'gzip'
				}, DEFAULT_HEADERS));

				switch(type) {
					case ResponseType['BYTE']: {
						return buffer;
					}

					case ResponseType['VIEW']: {
						return new DataView(buffer['buffer'], buffer['byteOffset'], buffer['byteLength']);
					}

					case ResponseType['TEXT']: {
						return toString(buffer);
					}

					case ResponseType['JSON']: {
						return JSON.parse(toString(buffer));
					}
				}
			} : request.bind(this),
			onRequest: optionsOnRequest || function (): void {},
			hash: optionsHash ? async function (data: string): Promise<Uint8Array> {
				return (await optionsHash(data)).subarray(0, 4);
			} : hash,
			indexMaximumAge: options['indexMaximumAge'] || options['indexMaximumAge'] === 0 ? options['indexMaximumAge'] : 600000
		});

		this['galleries'] = new GalleryManager(this);
		this['tags'] = new TagManager(this);

		defineProperties(this, {
			languageIndex: new IndexProvider(this, 'languages'),
			imageContext: new Provider<ImageContext>(this, async function (this: Provider<ImageContext>): Promise<ImageContext> {
				const response: string = await this['hitomi'].request(RESOURCE_DOMAIN, '/gg.js', ResponseType['TEXT']);
				const context: ImageContext = [new Set<number>(), false, ''];

				let currentIndex: number = 0;
				let nextIndex: number;

				while(
					// Kind of do-while loop
					(currentIndex = response.indexOf('case ', currentIndex) + 5) !== 4 &&
					(nextIndex = response.indexOf(':', currentIndex)) !== -1
				) {
					const subdomainCode: number = +response.slice(currentIndex, nextIndex);

					if(!Number.isInteger(subdomainCode)) {
						throw HitomiError['UnparsableImageContext'];
					}

					context[0].add(subdomainCode);

					currentIndex = nextIndex + 1;
				}

				if(!context[0]['size']) {
					throw HitomiError['UnparsableImageContext'];
				}

				currentIndex = response.indexOf('var o = ') + 8;

				const rawIsSuffix1: number = +response.slice(currentIndex, response.indexOf(';', currentIndex));

				if(!Number.isInteger(rawIsSuffix1)) {
					throw HitomiError['UnparsableImageContext'];
				}

				context[1] = !rawIsSuffix1;

				currentIndex = response.lastIndexOf('b: \'') + 4;

				if(currentIndex === 3) {
					throw HitomiError['UnparsableImageContext'];
				}

				context[2] = response.slice(currentIndex, response.indexOf('\'', currentIndex));

				if(!context[2]['length']) {
					throw HitomiError['UnparsableImageContext'];
				}

				return context;
			}, options['imageContextMaximumAge'] || options['imageContextMaximumAge'] === 0 ? options['imageContextMaximumAge'] : 3600000)
		});
	}
}