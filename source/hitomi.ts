import { Agent, request } from 'https';
import type { IncomingMessage } from 'http';
import { gunzip } from 'zlib';
import type { ImageContext, URL } from './utilities/types';
import { GalleryManager } from './gallery';
import { TagManager } from './tag';
import { DEFAULT_HEADERS, RESOURCE_DOMAIN, STALE_TIME_PROPERTIES } from './utilities/constants';
import { defineProperties, parseNumber } from './utilities/functions';
import { HitomiError, IndexProvider, Provider } from './utilities/structures';

/**
 * The client for interacting with the Hitomi API.
 * 
 * Provides access to gallery and tag management through dedicated managers.
 */
export class Hitomi {
	/**
	 * The manager for retrieving and listing galleries.
	 *
	 * @type {GalleryManager}
	 * @readonly
	 */
	public readonly galleries: GalleryManager;
	/**
	 * The manager for creating, parsing, searching, and listing tags.
	 *
	 * @type {TagManager}
	 * @readonly
	 */
	public readonly tags: TagManager;

	// @internal
	private readonly agent!: Agent;
	// @internal
	public readonly indexStaleTime!: number;
	// @internal
	public readonly languageIndex!: IndexProvider;
	// @internal
	public readonly imageContext!: Provider<ImageContext>;

	/**
	 * Creates a new Hitomi client.
	 *
	 * @param {Object} [options] Client configuration options.
	 * @param {Agent} [options.agent] A HTTPS {@link Agent} for connection pooling. (A keep-alive agent if omitted)
	 * @param {number} [options.indexStaleTime=600000] A cache stale time for the index version in milliseconds. (`600000` if omitted)
	 * @param {number} [options.imageContextStaleTime=3600000] A cache stale time for the image url context in milliseconds. (`3600000` if omitted)
	 */
	constructor(options: {
		agent?: Agent;
		indexStaleTime?: number;
		imageContextStaleTime?: number;
	} = {}) {
		for(let i: number = 0; i < STALE_TIME_PROPERTIES['length']; i++) {
			if(options[STALE_TIME_PROPERTIES[i]] && !Number.isFinite(options[STALE_TIME_PROPERTIES[i]]) || options[STALE_TIME_PROPERTIES[i]] as number < 1) {
				throw new HitomiError('options.' + STALE_TIME_PROPERTIES[i], 'a positive integer');
			}
		}

		defineProperties(this, {
			agent: options['agent'] || new Agent({
				keepAlive: true
			}),
			indexStaleTime: options['indexStaleTime'] || 600000
		});

		this['galleries'] = new GalleryManager(this);
		this['tags'] = new TagManager(this);

		defineProperties(this, {
			languageIndex: new IndexProvider(this, 'languages'),
			imageContext: new Provider<ImageContext>(this, async function (this: Provider<ImageContext>): Promise<ImageContext> {
				const response: string = String(await this['hitomi'].request([RESOURCE_DOMAIN, '/gg.js']));
				const context: ImageContext = [new Set<number>(), false, ''];
	
				let currentIndex: number = 0;
				let nextIndex: number;
	
				while((currentIndex = response.indexOf('case ', currentIndex) + 5) !== 4 && (nextIndex = response.indexOf(':', currentIndex)) !== -1) {
					context[0].add(+response.slice(currentIndex, nextIndex));
	
					currentIndex = nextIndex + 1;
				}
	
				context[1] = response.indexOf('var o = 0;') === -1;
	
				currentIndex = response.indexOf('\'', response.lastIndexOf('b:') + 2) + 1;
	
				context[2] = response.slice(currentIndex, response.indexOf('\'', currentIndex));
	
				if(!context[0]['size'] || context[0].has(NaN) || !context[2]['length']) {
					throw new HitomiError('ImageContextResolver must succeed');
				}
	
				return context;
			}, options['imageContextStaleTime'] || 3600000)
		});
	}

	// @internal
	public request(urn: Readonly<URL> | URL, range?: string): Promise<Buffer> {
		return new Promise<Buffer>(function (this: Hitomi, resolve: (value: Buffer) => void, reject: (error?: unknown) => void): void {
			request({
				agent: this['agent'],
				hostname: urn[0],
				path: urn[1],
				method: 'GET',
				port: 443,
				headers: range ? Object.assign({
					range: 'bytes=' + range
				}, DEFAULT_HEADERS) : DEFAULT_HEADERS
			}, function (response: IncomingMessage): void {
				switch(response['statusCode']) {
					case 200:
					case 206: {
						const buffer: Buffer = Buffer.allocUnsafe(parseNumber(response['headers']['content-length'] as string));
						let length: number = 0;
	
						response.on('data', function (chunk: Buffer): void {
							chunk.copy(buffer, length);
							length += chunk['byteLength'];
						})
						.once('end', function (): void {
							if(response['headers']['content-encoding']) {
								return gunzip(buffer, function (error: Error | null, decompressedBuffer: Buffer): void {
									if(error) {
										return reject(error);
									}
	
									resolve(decompressedBuffer);
								});
							}

							resolve(buffer);
						})
						.once('error', reject);
	
						break;
					}
	
					default: {
						throw new HitomiError('Request to https://' + urn[0] + urn[1] + ' must succeed');
					}
				}
			})
			.once('error', reject)
			.end();
		}.bind(this));
	}
}