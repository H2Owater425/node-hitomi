import { Agent, request } from 'https';
import type { IncomingMessage } from 'http';
import { gunzip } from 'zlib';
import type { ImageContext, URL } from './utilities/types';
import { GalleryManager } from './gallery';
import { TagManager } from './tag';
import { DEFAULT_HEADERS, RESOURCE_DOMAIN } from './utilities/constants';
import { defineProperty, parseNumber } from './utilities/functions';
import { HitomiError, IndexProvider, Provider } from './utilities/structures';

/**
 * The client for interacting with the Hitomi API.
 * 
 * Provides access to gallery and tag management through dedicated managers.
 */
export class Hitomi {
	/**
	 * The HTTPS agent used for connection pooling.
	 *
	 * @type {Agent}
	 * @readonly
	 */
	public readonly agent!: Agent;
	/**
	 * The manager for retrieving and listing galleries.
	 *
	 * @type {GalleryManager}
	 * @readonly
	 */
	public readonly galleries: GalleryManager = new GalleryManager(this);
	/**
	 * The manager for creating, parsing, searching, and listing tags.
	 *
	 * @type {TagManager}
	 * @readonly
	 */
	public readonly tags: TagManager = new TagManager(this);

	// @internal
	public readonly languageIndex!: IndexProvider;
	// @internal
	public readonly imageContext!: Provider<ImageContext>;

	/**
	 * Creates a new Hitomi client.
	 *
	 * @param {Agent} [agent] An optional HTTPS {@link Agent} for connection pooling. (A keep-alive agent if omitted)
	 */
	constructor(agent: Agent = new Agent({
		keepAlive: true
	})) {
		this['agent'] = agent;
		defineProperty(this, 'languageIndex', new IndexProvider(this, 'languages'));
		defineProperty(this, 'imageContext', new Provider<ImageContext>(this, async function (this: Provider<ImageContext>): Promise<ImageContext> {
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
		}, 3600000));
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