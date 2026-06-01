import { describe, test } from 'mocha';
import assert from 'assert';

import { Title, GalleryReference, TranslatedGallery, Gallery } from '@/structures/gallery';
import { Tag } from '@/structures/tag';
import { Language } from '@/structures/tag';
import { Image, Video } from '@/structures/media';
import { BASE_DOMAIN } from '@/internal/constants';
import { GalleryManager, SortType } from '@/managers/gallery';
import { Hitomi } from '@/hitomi';
import { createMock, assertInstanceOf } from './shared/functions';
import { ResponseType, RequestCall } from './shared/types';

describe('Title', function (): void {
	test('constructor stores display and japanese fields', function (): void {
		const title: Title = new Title('Title');
		const withJapanese: Title = new Title('Title', '題目');

		assert.strictEqual(title['display'], 'Title');
		assert.strictEqual(title['japanese'], null);
		assert.strictEqual(withJapanese['japanese'], '題目');
	});
});

describe('GalleryReference', function (): void {
	test('retrieve delegates to galleries manager.retrieve', async function (): Promise<void> {
		const calls: number[] = [];
		const id: number = 123456;
		const gallery: Gallery = createMock<Gallery>({
			id: id
		});
		const hitomi: Hitomi = createMock<Hitomi>({
			galleries: createMock<Hitomi['galleries']>({
				retrieve: function (id: number): Promise<Gallery> {
					calls.push(id);

					return Promise.resolve(gallery);
				}
			})
		});
		const reference: GalleryReference = new GalleryReference(hitomi, id);
		const retrievedGallery: Gallery = await reference.retrieve();

		assert.deepStrictEqual(calls, [id]);
		assert.strictEqual(retrievedGallery, gallery);
	});
});

describe('Gallery', function (): void {
	test('getThumbnails returns first and middle files', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});

		const translationLanguage: Language = new Language(hitomi, 'english', 'English');
		const translationId: number = 234567;
		const translation: TranslatedGallery = new TranslatedGallery(hitomi, translationId, translationLanguage, '/galleries/' + translationId + '.html');

		const id: number = 123456;
		const language: Language = new Language(hitomi, 'japanese', '日本語');
		const files: Image[] = [
			new Image(hitomi, 1000, 1500, '0123456789abcdef', '1.jpg', true, true, false, true),
			new Image(hitomi, 1000, 1500, '123456789abcdef0', '2.jpg', true, true, false, true),
			new Image(hitomi, 1000, 1500, '23456789abcdef01', '3.jpg', true, true, false, false)
		];
		const gallery: Gallery = new Gallery(
			hitomi,
			id,
			language,
			'/galleries/' + id + '.html',
			new Title('Test gallery'),
			'manga',
			[],
			[],
			[],
			[],
			[],
			files,
			[translation],
			[],
			false,
			new Date()
		);

		const thumbnails: [Image, Image] = gallery.getThumbnails();

		assert.strictEqual(gallery['id'], id);
		assert.strictEqual(gallery['language'], language);
		assert.strictEqual(gallery['url'], '/galleries/' + id + '.html');
		assert.strictEqual(translation['id'], translationId);
		assert.strictEqual(translation['url'], '/galleries/' + translationId + '.html');
		assert.strictEqual(translation['language'], translationLanguage);
		assert.deepStrictEqual(thumbnails, [files[0], files[Math.floor(files['length'] / 2)]]);
	});
});

describe('GalleryManager', function (): void {
	test('retrieve builds a full Gallery from response payload', async function (): Promise<void> {
		const id: number = 123456;
		const translationId: number = 234567;
		const rawGallery = {
			id: String(id),
			type: 'manga',
			galleryurl: '/galleries/' + id + '.html',
			language: 'english',
			language_localname: 'English',
			title: 'A mocked gallery',
			japanese_title: null,
			artists: null,
			groups: null,
			parodys: [{
				parody: 'series tag'
			}],
			characters: [{
				character: 'author tag'
			}],
			tags: [{
				tag: 'general tag'
			},
			{
				tag: 'male tag',
				male: 1
			},
			{
				tag: 'female tag',
				female: 1
			}],
			files: [{
				hash: '0123456789abcdef',
				name: '1.jpg',
				width: 1000,
				height: 1500,
				hasavif: 1
			},
			{
				hash: '123456789abcdef0',
				name: '2.jpg',
				width: 1280,
				height: 720
			}],
			languages: [{
				galleryid: translationId,
				name: 'japanese',
				language_localname: '日本語',
				url: '/galleries/' + translationId + '.html'
			}],
			related: [345678],
			blocked: 0,
			date: new Date().toISOString(),
			datepublished: new Date(Date.now() - 90061000).toISOString(),
			videofilename: 'video-' + id + '.mp4'
		} as const;

		const calls: RequestCall[] = [];
		const hitomi: Hitomi = createMock<Hitomi>({
			indexMaximumAge: 600000,
			request: createMock<Hitomi['request']>(function (host: string, path: string, type: ResponseType, range?: string): Promise<string> {
				calls.push({
					host: host,
					path: path,
					type: type,
					range: range
				});

				return Promise.resolve('var galleryinfo = ' + JSON.stringify(rawGallery));
			})
		});
		const manager: GalleryManager = new GalleryManager(hitomi);

		const gallery: Gallery = await manager.retrieve(id);

		assert.deepStrictEqual(calls, [{
			host: 'ltn.gold-usergeneratedcontent.net',
			path: '/galleries/' + id + '.js',
			type: ResponseType['TEXT'],
			range: undefined
		}]);

		assertInstanceOf(gallery, Gallery);

		assert.strictEqual(gallery['id'], +rawGallery['id']);
		assert.strictEqual(gallery['url'], rawGallery['galleryurl']);

		assert.strictEqual(gallery['title']['display'], rawGallery['title']);
		assert.strictEqual(gallery['title']['japanese'], rawGallery['japanese_title']);

		assert.strictEqual(gallery['type'], rawGallery['type']);

		assert.strictEqual(gallery['artists']['length'], 0);

		assert.strictEqual(gallery['groups']['length'], 0);

		assert.strictEqual(gallery['series']['length'], rawGallery['parodys']['length']);

		for(let i: number = 0; i < gallery['series']['length']; i++) {
			assertInstanceOf(gallery['series'][i], Tag);
		}

		assert.strictEqual(gallery['characters']['length'], rawGallery['characters']['length']);

		for(let i: number = 0; i < gallery['characters']['length']; i++) {
			assertInstanceOf(gallery['characters'][i], Tag);
		}

		for(let i: number = 0; i < gallery['tags']['length']; i++) {
			let type: Tag['type'] = 'tag';

			// @ts-expect-error
			if(Boolean(rawGallery['tags'][i]['male'])) {
				type = 'male';
			// @ts-expect-error
			} else if(Boolean(rawGallery['tags'][i]['female'])) {
				type = 'female';
			}

			assert.strictEqual(gallery['tags'][i]['type'], type);
		}

		const thumbnailIndex: number = Math.floor(gallery['files']['length'] / 2);

		for(let i: number = 0; i < gallery['files']['length']; i++) {
			// @ts-expect-error
			assert.ok(gallery['files'][i]['hasAvif'] === Boolean(rawGallery['files'][i]['hasavif']));
			assert.ok(gallery['files'][i]['hasThumbnail'] === (i === 0 || i === thumbnailIndex));
		}

		assert.strictEqual(gallery['translations']['length'], rawGallery['languages']['length']);

		for(let i: number = 0; i < gallery['translations']['length']; i++) {
			assertInstanceOf(gallery['translations'][i], TranslatedGallery);
			assert.strictEqual(gallery['translations'][i]['id'], rawGallery['languages'][i]['galleryid']);

			assertInstanceOf(gallery['translations'][i]['language'], Language);
			// @ts-expect-error
			assert.strictEqual(gallery['translations'][i]['language']['name'], rawGallery['languages'][i]['name']);
			// @ts-expect-error
			assert.strictEqual(gallery['translations'][i]['language']['localName'], rawGallery['languages'][i]['language_localname']);
			assert.strictEqual(gallery['translations'][i]['url'], rawGallery['languages'][i]['url']);
		}

		assert.strictEqual(gallery['relations']['length'], rawGallery['related']['length']);

		for(let i: number = 0; i < gallery['relations']['length']; i++) {
			assertInstanceOf(gallery['relations'][i], GalleryReference);
			assert.strictEqual(gallery['relations'][i]['id'], rawGallery['related'][i]);
		}

		assert.strictEqual(gallery['isBlocked'], false);

		assert.strictEqual(gallery['addedDate'].toISOString(), rawGallery['date']);
		assert.strictEqual(gallery['publishedDate']?.toISOString(), rawGallery['datepublished']);

		assertInstanceOf(gallery['video'], Video);
		assert.strictEqual(gallery['video']['fileName'], rawGallery['videofilename']);
		assert.strictEqual(gallery['video']['height'], rawGallery['files'][1]['height']);
		assert.strictEqual(gallery['video']['width'], rawGallery['files'][1]['width']);
		assert.strictEqual(gallery['video']['url'], '//streaming.' + BASE_DOMAIN + '/videos/' + rawGallery['videofilename']);
		assert.strictEqual(gallery['video']['posterUrl'], '//a.' + BASE_DOMAIN + '/videos/posters/' + rawGallery['files'][1]['hash'].slice(-1) + '/' + rawGallery['files'][1]['hash'].slice(-3, -1) + '/' + rawGallery['files'][1]['hash'] + '.webp');
	});

	test('list rejects page with multiple non-language tags', async function (): Promise<void> {
		const hitomi: Hitomi = createMock<Hitomi>({
			indexMaximumAge: 600000,
			request: createMock<Hitomi['request']>(function (): never {
				throw new Error('request should not be called');
			})
		});
		const manager: GalleryManager = new GalleryManager(hitomi);
		const tags: Tag[] = [new Tag(hitomi, 'artist', 'artist tag'), new Tag(hitomi, 'group', 'group tag')];

		await assert.rejects(function (): Promise<GalleryReference[]> {
			return manager.list({
				tags: tags,
				page: {
					index: 0,
					size: 10
				}
			});
		}, /Page must not be used with multiple tags/);
	});

	test('list returns paginated references for tag query', async function (): Promise<void> {
		const calls: RequestCall[] = [];
		const hitomi: Hitomi = createMock<Hitomi>({
			indexMaximumAge: 600000,
			request: createMock<Hitomi['request']>(function (host: string, path: string, type: ResponseType, range?: string): DataView {
				calls.push({
					host: host,
					path: path,
					type: type,
					range: range
				});

				const response: DataView = new DataView(new ArrayBuffer(8));

				response.setInt32(0, 11);
				response.setInt32(4, 22);

				return response;
			})
		});
		const manager: GalleryManager = new GalleryManager(hitomi);

		const references: GalleryReference[] = await manager.list({
			tags: [new Tag(hitomi, 'artist', 'john doe')],
			orderBy: SortType.DateAdded,
			page: {
				index: 1,
				size: 2
			}
		});
		const ids: GalleryReference['id'][] = [];

		for(let i: number = 0; i < references['length']; i++) {
			ids.push(references[i]['id']);
		}

		assert.deepStrictEqual(calls, [{
			host: 'ltn.gold-usergeneratedcontent.net',
			path: '/n/artist/john%20doe-all.nozomi',
			type: ResponseType['VIEW'],
			range: '8-15'
		}]);
		assert.deepStrictEqual(ids, [11, 22]);
	});
});
