import { describe, test } from 'mocha';
import assert from 'assert';

import { Image, Video } from '@/structures/media';
import { Extension, ThumbnailSize } from '@/structures/media';
import { Hitomi } from '@/hitomi';
import type { ImageContext } from '@/internal/types';
import { createMock } from './shared/functions';
import { ResponseType, RequestCall } from './shared/types';

describe('Image', function (): void {
	test('resolveUrl rejects unsupported extension', async function (): Promise<void> {
		const image: Image = new Image(createMock<Hitomi>({}), 1000, 1500, '0123456789abcdef', '1.jpg', false, true, false, true);

		await assert.rejects(function (): Promise<string> {
			return image.resolveUrl(Extension['Avif']);
		}, /Extension must be available/);
	});

	test('resolveUrl rejects invalid thumbnail and extension combinations', async function (): Promise<void> {
		const image: Image = new Image(createMock<Hitomi>({}), 1000, 1500, '0123456789abcdef', '1.jpg', false, true, false, false);
		const imageWithThumbnail: Image = new Image(createMock<Hitomi>({}), 1000, 1500, '123456789abcdef0', '2.jpg', true, true, false, true);

		await assert.rejects(function (): Promise<string> {
			return imageWithThumbnail.resolveUrl(Extension['Webp'], ThumbnailSize['Medium']);
		}, /ThumbnailSize.Medium must be used only with avif/);
		await assert.rejects(function (): Promise<string> {
			return image.resolveUrl(Extension['Webp'], ThumbnailSize['Big']);
		}, /ThumbnailSize.Big must be used only with image that has thumbnail/);
	});

	test('resolveUrl uses imageContext for full-size url', async function (): Promise<void> {
		const hash: string = '0123456789abcdef';
		const hashCode: number = Number.parseInt(hash.slice(-1) + hash.slice(-3, -1), 16);
		let retrieveCalls: number = 0;
		const context: ImageContext = [new Set<number>([hashCode]), true, 'galleries/'];
		const hitomi: Hitomi = createMock<Hitomi>({
			imageContext: createMock<Hitomi['imageContext']>({
				retrieve: function (): Promise<ImageContext> {
					retrieveCalls++;

					return Promise.resolve(context);
				}
			})
		});
		const image: Image = new Image(hitomi, 1000, 1500, hash, '1.jpg', false, true, false, true);

		const url: string = await image.resolveUrl(Extension['Webp']);

		assert.strictEqual(url, '//w2.gold-usergeneratedcontent.net/galleries/' + hashCode + '/' + hash + '.webp');
		assert.strictEqual(retrieveCalls, 1);
	});

	test('fetch requests resolved url through client.request', async function (): Promise<void> {
		const calls: RequestCall[] = [];
		const response: Uint8Array = Buffer.alloc(0);
		const hitomi: Hitomi = createMock<Hitomi>({
			request: createMock<Hitomi['request']>(function (host: string, path: string, type: ResponseType, range?: string): Uint8Array {
				calls.push({
					host: host,
					path: path,
					type: type,
					range: range
				});

				return response;
			})
		});
		const image: Image = new Image(hitomi, 1000, 1500, 'abcdef012345', '1.webp', false, true, false, true);

		const imageBuffer: Uint8Array = await image.fetch(Extension['Webp'], ThumbnailSize['Small']);

		assert.strictEqual(imageBuffer, response);
		assert.deepStrictEqual(calls, [{
			host: 'tn.gold-usergeneratedcontent.net',
			path: '/webpsmalltn/5/34/abcdef012345.webp',
			type: ResponseType['BYTE'],
			range: undefined
		}]);
	});
});

describe('Video', function (): void {
	test('constructor exposes generated urls', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});
		const video: Video = new Video(hitomi, 1280, 720, 'video-123456.mp4', '0123456789abcdef');

		assert.strictEqual(video.url, '//streaming.gold-usergeneratedcontent.net/videos/video-123456.mp4');
		assert.strictEqual(video.posterUrl, '//a.gold-usergeneratedcontent.net/videos/posters/f/de/0123456789abcdef.webp');
	});

	test('fetch and fetchPoster request resolved urls through client.request', async function (): Promise<void> {
		const calls: RequestCall[] = [];

		const videoResponse: Uint8Array = Buffer.alloc(0);
		const posterResponse: Uint8Array = Buffer.alloc(0);

		const hitomi: Hitomi = createMock<Hitomi>({
			request: createMock<Hitomi['request']>(function (host: string, path: string, type: ResponseType, range?: string): Uint8Array {
				calls.push({
					host: host,
					path: path,
					type: type,
					range: range
				});

				if(host.startsWith('streaming.')) {
					return videoResponse;
				}

				return posterResponse;
			})
		});
		const video: Video = new Video(hitomi, 1280, 720, 'video-123456.mp4', '0123456789abcdef');

		const videoBuffer: Uint8Array = await video.fetch();
		const posterBuffer: Uint8Array = await video.fetchPoster();

		assert.strictEqual(videoBuffer, videoResponse);
		assert.strictEqual(posterBuffer, posterResponse);
		assert.deepStrictEqual(calls, [{
			host: 'streaming.gold-usergeneratedcontent.net',
			path: '/videos/video-123456.mp4',
			type: ResponseType['BYTE'],
			range: undefined
		},
		{
			host: 'a.gold-usergeneratedcontent.net',
			path: '/videos/posters/f/de/0123456789abcdef.webp',
			type: ResponseType['BYTE'],
			range: undefined
		}]);
	})
});
