import type { ImageContext } from './internal/types';
import { GalleryManager } from './gallery';
import { TagManager } from './tag';
import { DEFAULT_HEADERS, RESOURCE_DOMAIN, MAXIMUM_AGE_PROPERTIES } from './internal/constants';
import { defineProperties, capitalize } from './internal/functions';
import { IndexProvider, Provider } from './internal/structures';
import { HitomiError } from './error';
import { request, type RequestFunction, hash, type HashFunction, ResponseType, toString, RequestContext, OnRequestFunction } from '@platform';

/**
 * Configuration options for creating a Hitomi client.
 * 
 * @see {@link Hitomi}
 */
export interface HitomiOptions<T = unknown> {
	/**
	 * HTTPS Agent instance for connection reuse.
	 * 
	 * @default new Agent({ keepAlive: true })
	 * @deprecated Use {@link onRequest} instead (overrides it if set). Will be removed in v10.
	 */
	agent?: unknown;
	/**
	 * HTTPS request function.
	 */
	request?: RequestFunction;
	/**
	 * Request hook function.
	 */
	onRequest?: OnRequestFunction<T>;
	/**
	 * SHA-256 hash function.
	 */
	hash?: HashFunction;
	/**
	 * Maximum age of cached index version in milliseconds.
	 *
	 * @default 600000
	 */
	indexMaximumAge?: number;
	/**
	 * Maximum age of cached image URL context in milliseconds.
	 *
	 * @default 3600000
	 */
	imageContextMaximumAge?: number;
}

/**
 * Client for interacting with Hitomi API
 */
export class Hitomi {
	/**
	 * Manager for retrieving and listing galleries.
	 *
	 * @type {GalleryManager}
	 * @readonly
	 */
	public readonly galleries: GalleryManager;
	/**
	 * Manager for creating, parsing, searching, and listing tags.
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
	 * @param {HitomiOptions} [options] Configuration options.
	 */
	constructor(options: HitomiOptions = {}) {
		for(let i: number = 0; i < MAXIMUM_AGE_PROPERTIES['length']; i++) {
			if(options[MAXIMUM_AGE_PROPERTIES[i]] && (!Number.isInteger(options[MAXIMUM_AGE_PROPERTIES[i]]) || options[MAXIMUM_AGE_PROPERTIES[i]] as number < 0)) {
				throw new HitomiError(capitalize(MAXIMUM_AGE_PROPERTIES[i]), 'an integer greater than 0');
			}
		}

		// Options object might be modified
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
			indexMaximumAge: options['indexMaximumAge'] || 600000
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
						throw HitomiError['ImageContextResolverFail'];
					}

					context[0].add(subdomainCode);

					currentIndex = nextIndex + 1;
				}

				if(!context[0]['size']) {
					throw HitomiError['ImageContextResolverFail'];
				}

				currentIndex = response.indexOf('var o = ') + 8;

				const rawIsSuffix1: number = +response.slice(currentIndex, response.indexOf(';', currentIndex));

				if(!Number.isInteger(rawIsSuffix1)) {
					throw HitomiError['ImageContextResolverFail'];
				}

				context[1] = !rawIsSuffix1;

				currentIndex = response.lastIndexOf('b: \'') + 4;

				if(currentIndex === 3) {
					throw HitomiError['ImageContextResolverFail'];
				}

				context[2] = response.slice(currentIndex, response.indexOf('\'', currentIndex));

				if(!context[2]['length']) {
					throw HitomiError['ImageContextResolverFail'];
				}

				return context;
			}, options['imageContextMaximumAge'] || 3600000)
		});
	}
}