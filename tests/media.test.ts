import { describe, test } from 'node:test';
import assert from 'assert/strict';

import { Image, Video } from '../source/media';
import { Extension, ThumbnailSize } from '../source/utilities/constants';
import { Hitomi } from '../source/hitomi';
import type { ImageContext, URL } from '../source/utilities/types';
import { createMock } from './utilities/functions';

describe('Image', function (): void {
	test('resolveUrl rejects unsupported extension', async function (): Promise<void> {
		const image: Image = new Image(createMock({}), 1000, 1500, '0123456789abcdef', '1.jpg', false, true, false, true);

		await assert.rejects(function (): Promise<string> {
			return image.resolveUrl(Extension['Avif']);
		}, /Extension must be supported/);
	});

	test('resolveUrl rejects invalid thumbnail and extension combinations', async function (): Promise<void> {
		const image: Image = new Image(createMock({}), 1000, 1500, '0123456789abcdef', '1.jpg', false, true, false, false);
		const imageWithThumbnail: Image = new Image(createMock({}), 1000, 1500, '123456789abcdef0', '2.jpg', true, true, false, true);

		await assert.rejects(async function (): Promise<string> {
			return imageWithThumbnail.resolveUrl(Extension['Webp'], ThumbnailSize['Medium']);
		}, /ThumbnailSize.Medium must be used only with avif/);
		await assert.rejects(async function (): Promise<string> {
			return image.resolveUrl(Extension['Webp'], ThumbnailSize['Big']);
		}, /ThumbnailSize.Big must be used only with image that has thumbnail/);
	});

	test('resolveUrl uses imageContext for full-size url', async function (): Promise<void> {
		const hash: string = '0123456789abcdef';
		const hashCode: number = Number.parseInt(hash.slice(-1) + hash.slice(-3, -1), 16);
		let retrieveCalls: number = 0;
		const context: ImageContext = [new Set<number>([hashCode]), true, 'galleries/'];
		const hitomi: Hitomi = createMock<Hitomi>({
			imageContext: {
				retrieve: async function (): Promise<ImageContext> {
					retrieveCalls++;

					return context;
				}
			}
		});
		const image: Image = new Image(hitomi, 1000, 1500, hash, '1.jpg', false, true, false, true);

		const url: string = await image.resolveUrl(Extension['Webp']);

		assert.strictEqual(url, '//w2.gold-usergeneratedcontent.net/galleries/' + hashCode + '/' + hash + '.webp');
		assert.strictEqual(retrieveCalls, 1);
	});

	test('fetch requests resolved url through client.request', async function (): Promise<void> {
		const calls: {
			url: URL;
			range: string | undefined;
		}[] = [];
		const response: Buffer = Buffer.alloc(0);
		const hitomi: Hitomi = createMock<Hitomi>({
			request: async function (url: URL, range?: string): Promise<Buffer> {
				calls.push({
					url: url,
					range: range
				});

				return response;
			}
		});
		const image: Image = new Image(hitomi, 1000, 1500, 'abcdef012345', '1.webp', false, true, false, true);

		const imageBuffer: Buffer = await image.fetch(Extension['Webp'], ThumbnailSize['Small']);

		assert.strictEqual(imageBuffer, response);
		assert.deepStrictEqual(calls, [{
			url: ['tn.gold-usergeneratedcontent.net', '/webpsmalltn/5/34/abcdef012345.webp'],
			range: undefined
		}]);
	});
});

describe('Video', function (): void {
	test('constructor exposes generated urls', async function (): Promise<void> {
		const hitomi: Hitomi = createMock<Hitomi>({});
		const video: Video = new Video(hitomi, 1280, 720, 'video-123456.mp4', '0123456789abcdef');

		assert.strictEqual(video.url, '//streaming.gold-usergeneratedcontent.net/videos/video-123456.mp4');
		assert.strictEqual(video.posterUrl, '//a.gold-usergeneratedcontent.net/videos/posters/f/de/0123456789abcdef.webp');
	});

	test('fetch and fetchPoster request resolved urls through client.request', async function (): Promise<void> {
		const calls: {
			url: URL;
			range: string | undefined;
		}[] = [];

		const videoResponse: Buffer = Buffer.alloc(0);
		const posterResponse: Buffer = Buffer.alloc(0);

		const hitomi: Hitomi = createMock<Hitomi>({
			request: async function (url: URL, range?: string): Promise<Buffer> {
				calls.push({
					url: url,
					range: range
				});

				if(url[0].startsWith('streaming.')) {
					return videoResponse;
				}

				return posterResponse;
			}
		});
		const video: Video = new Video(hitomi, 1280, 720, 'video-123456.mp4', '0123456789abcdef');

		const videoBuffer: Buffer = await video.fetch();
		const posterBuffer: Buffer = await video.fetchPoster();

		assert.strictEqual(videoBuffer, videoResponse);
		assert.strictEqual(posterBuffer, posterResponse);
		assert.deepStrictEqual(calls, [{
			url: ['streaming.gold-usergeneratedcontent.net', '/videos/video-123456.mp4'],
			range: undefined
		},
		{
			url: ['a.gold-usergeneratedcontent.net', '/videos/posters/f/de/0123456789abcdef.webp'],
			range: undefined
		}]);
	})
});
