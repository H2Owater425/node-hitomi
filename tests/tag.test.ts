import { describe, test } from 'mocha';
import { strict as assert } from 'assert';

import { Language, Tag } from '@/structures/tag';
import { ErrorCode } from '@/structures/error';
import { TagManager, NameInitial } from '@/managers/tag';
import { Hitomi } from '@/hitomi';
import type { Node } from '@/internal/types';
import { assertInstanceOf, createError, createMock } from './shared/functions';
import { createHash } from 'crypto';
import { PARTIAL_TAG_TYPES } from './shared/constants';
import { ResponseType, RequestCall } from './shared/types';
import { Gallery } from '@/structures/gallery';

describe('Language', function (): void {
	test('constructor exposes url and toTag converts to language tag', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});
		const language: Language = new Language(hitomi, 'english', 'English');
		const tag: Tag = language.toTag(true);

		assert.equal(language['url'], '/index-english.html');

		assertInstanceOf(tag, Tag);
		assert.equal(tag['type'], 'language');
		assert.equal(tag['name'], 'english');
		assert.equal(tag['isNegative'], true);
		assert.equal(tag['url'], '/index-english.html');
	});

	test('constructor accepts all known language tuples', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});

		for(let i: number = 0; i < Language['ORDERED']['length']; i++) {
			const language: Language = new Language(hitomi, Language['ORDERED'][i][0], Language['ORDERED'][i][1]);

			assert.equal(language['name'], Language['ORDERED'][i][0]);
			assert.equal(language['localName'], Language['ORDERED'][i][1]);
			assert.equal(language['url'], '/index-' + Language['ORDERED'][i][0] + '.html');
		}
	});
});

describe('Tag', function (): void {
	test('constructor accepts all known names for language type', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});

		for(const name of Language['NAMES']) {
			const tag: Tag = new Tag(hitomi, 'language', name);

			assert.equal(tag['type'], 'language');
			assert.equal(tag['name'], name);
			assert.equal(tag['url'], '/index-' + name + '.html');
		}
	});

	test('constructor accepts all known names for type tag', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});

		for(const type of Gallery['TYPES']) {
			const tag: Tag = new Tag(hitomi, 'type', type);

			assert.equal(tag['type'], 'type');
			assert.equal(tag['name'], type);
			assert.equal(tag['url'], '/type/' + encodeURIComponent(type) + '-all.html');
		}
	});

	test('constructor accepts known non-language and non-type tags', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});

		for(const type of PARTIAL_TAG_TYPES) {
			const name: string = type + ' tag';
			const tag: Tag = new Tag(hitomi, type, name);
			let url: string;

			switch(type) {
				case 'male':
				case 'female': {
					url = '/tag/' + type + '%3A';

					break;
				}

				default: {
					url = '/' + type + '/'; 
				}
			}

			assert.equal(tag['type'], type);
			assert.equal(tag['name'], name);
			assert.equal(tag['url'], url + encodeURIComponent(name) + '-all.html');
		}
	})

	test('constructor rejects invalid inputs', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});

		assert.throws(function (): void {
			// @ts-expect-error
			new Tag(hitomi, 'company', 'frost nova');
		}, createError(ErrorCode['InvalidArgument'], /Type must be one of/));
		assert.throws(function (): void {
			new Tag(hitomi, 'language', 'typescript');
		}, createError(ErrorCode['InvalidArgument'], /Name must be one of/));
		assert.throws(function (): void {
			new Tag(hitomi, 'type', 'encyclopedia');
		}, createError(ErrorCode['InvalidArgument'], /Name must be one of/));
	});

	test('constructor sets generated url', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});
		const maleTag: Tag = new Tag(hitomi, 'male', 'male tag');
		const artistTag: Tag = new Tag(hitomi, 'artist', 'artist tag');

		assert.equal(maleTag['url'], '/tag/male%3Amale%20tag-all.html');
		assert.equal(artistTag['url'], '/artist/artist%20tag-all.html');
	});

	test('toString returns formatted expression', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});
		const tag: Tag = new Tag(hitomi, 'tag', 'general tag', true);

		assert.equal(tag.toString(), '-tag:general_tag');
		assert.equal(tag.toString(false), 'tag:general_tag');
	})

	test('listLanguages returns direct mapping for language tag without index access', async function (): Promise<void> {
		const hitomi: Hitomi = createMock<Hitomi>({
			languageIndex: createMock<Hitomi['languageIndex']>({
				retrieve: function (): Promise<string> {
					return Promise.reject(new Error('retrieve should not be called'));
				},
				getNodeAtAddress: function (): Promise<Node | undefined> {
					return Promise.reject(new Error('getNodeAtAddress should not be called'));
				},
				binarySearch: function (): Promise<Node[1][number] | undefined> {
					return Promise.reject(new Error('binarySearch should not be called'));
				}
			})
		});
		const tag: Tag = new Tag(hitomi, 'language', 'japanese');

		const languages: Language[] = await tag.listLanguages();

		assert.equal(languages['length'], 1);
		assert.equal(languages[0]['name'], 'japanese');
		assert.equal(languages[0]['localName'], '日本語');
	});

	test('listLanguages uses language index for non-language tags', async function (): Promise<void> {
		const rootNode: Node = [[Buffer.alloc(0)], [[1n, 2]], [3n]];
		const version: string = '12345678';
		const calls: {
			function: string;
			address?: bigint;
			version?: string;
			key?: Uint8Array;
			root?: Node;
		}[] = []; 
		const hitomi: Hitomi = createMock<Hitomi>({
			hashTerm: function (term: string): Promise<Uint8Array> {
				return Promise.resolve(createHash('sha256').update(term).digest().subarray(0, 4));
			},
			languageIndex: createMock<Hitomi['languageIndex']>({
				retrieve: function (): Promise<string> {
					calls.push({
						function: 'retrieve'
					});

					return Promise.resolve(version);
				},
				getNodeAtAddress: function (address: bigint, version: string): Promise<Node> {
					calls.push({
						function: 'getNodeAtAddress',
						address: address,
						version: version
					});

					return Promise.resolve(rootNode);
				},
				binarySearch: function (key: Uint8Array, root: Node, version: string): Promise<Node[1][number]> {
					calls.push({
						function: 'binarySearch',
						key: key,
						root: root,
						version: version
					});

					return Promise.resolve([13n, 0]);
				}
			})
		});
		const tag: Tag = new Tag(hitomi, 'female', 'glasses');

		const languages: Language[] = await tag.listLanguages();

		assert.deepEqual(calls, [{
			function: 'retrieve'
		}, {
			function: 'getNodeAtAddress',
			address: 0n,
			version: version
		}, {
			function: 'binarySearch',
			key: createHash('sha256').update('tag/female:glasses').digest().subarray(0, 4),
			root: rootNode,
			version: version
		}]);

		const binaryOrderedLanguages: (typeof Language['ORDERED'])[number][] = [
			Language['ORDERED'][0],
			Language['ORDERED'][2],
			Language['ORDERED'][3]
		];

		for(let i: number = 0; i < languages['length']; i++) {
			assert.deepEqual(languages[i]['name'], binaryOrderedLanguages[i][0]);
			assert.deepEqual(languages[i]['localName'], binaryOrderedLanguages[i][1]);
		}
	});

	test('listLanguages rejects invalid tag name', async function (): Promise<void> {
		const hitomi: Hitomi = createMock<Hitomi>({
			hashTerm: function (): Promise<Uint8Array> {
				return Promise.resolve(Buffer.alloc(4));
			},
			languageIndex: createMock<Hitomi['languageIndex']>({
				retrieve: function (): Promise<string> {
					return Promise.resolve('12345678');
				},
				getNodeAtAddress: function (): Promise<Node> {
					return Promise.resolve([[Buffer.alloc(0)], [], [0n]]);
				},
				binarySearch: function (): Promise<Node[1][number] | undefined> {
					return Promise.resolve(undefined);
				}
			})
		});
		const tag: Tag = new Tag(hitomi, 'female', 'unknown');

		await assert.rejects(function (): Promise<Language[]> {
			return tag.listLanguages();
		}, createError(ErrorCode['InvalidField'], /Name must be valid/));
	});
});

describe('TagManager', function (): void {
	test('create and parse support underscores, negatives, and deduplication', function (): void {
		const manager: TagManager = new TagManager(createMock<Hitomi>({}));

		manager.create('character', 'character_tag');

		const tags: Tag[] = manager.parse('artist:artist_tag -tag:general_tag invalid artist:artist_tag');

		assert.equal(tags['length'], 2);

		assert.equal(tags[0]['type'], 'artist');
		assert.equal(tags[0]['name'], 'artist tag');
		assert.equal(tags[0]['isNegative'], false);

		assert.equal(tags[1]['type'], 'tag');
		assert.equal(tags[1]['name'], 'general tag');
		assert.equal(tags[1]['isNegative'], true);
	});

	test('create rejects invalid type and empty name', function (): void {
		const manager: TagManager = new TagManager(createMock<Hitomi>({}));

		assert.throws(function (): void {
			// @ts-expect-error
			manager.create('species', 'ghost');
		}, createError(ErrorCode['InvalidArgument'], /Type must be one of/));

		assert.throws(function (): void {
			manager.create('tag', '');
		}, createError(ErrorCode['InvalidArgument'], /Name must not be empty/));
	});

	test('search builds request path and maps response pairs', async function (): Promise<void> {
		const calls: RequestCall[] = [];
		const rawTagAndCounts: [string, number, string][] = [
			['swimsuit', 70000, 'female'],
			['sweating', 50000, 'female']
		];
		const hitomi: Hitomi = createMock<Hitomi>({
			request: createMock<Hitomi['request']>(function (host: string, path: string, type: ResponseType, range?: string): [string, number, string][] {
				calls.push({
					host: host,
					path: path,
					type: type,
					range: range
				});

				return rawTagAndCounts;
			})
		});
		const manager: TagManager = new TagManager(hitomi);

		const tagAndCounts: [Tag, number][] = await manager.search('-sw');
		const femaleTagAndCounts: [Tag, number][] = await manager.search('-female:sw:::unreachable:');

		assert.deepEqual(calls, [{
			host: 'tagindex.hitomi.la',
			path: '/global/s/w.json',
			type: ResponseType['JSON'],
			range: undefined
		}, {
			host: 'tagindex.hitomi.la',
			path: '/female/s/w.json',
			type: ResponseType['JSON'],
			range: undefined
		}]);

		assert.equal(tagAndCounts['length'], rawTagAndCounts['length']);

		for(let i: number = 0; i < tagAndCounts['length']; i++) {
			assertInstanceOf(tagAndCounts[i][0], Tag);
			assert.equal(tagAndCounts[i][0]['type'], rawTagAndCounts[i][2]);
			assert.equal(tagAndCounts[i][0]['name'], rawTagAndCounts[i][0]);
			assert.equal(tagAndCounts[i][0]['isNegative'], false);
			assert.equal(tagAndCounts[i][1], rawTagAndCounts[i][1]);
		}

		assert.equal(femaleTagAndCounts['length'], rawTagAndCounts['length']);

		for(let i: number = 0; i < femaleTagAndCounts['length']; i++) {
			assertInstanceOf(femaleTagAndCounts[i][0], Tag);
			assert.equal(femaleTagAndCounts[i][0]['type'], rawTagAndCounts[i][2]);
			assert.equal(femaleTagAndCounts[i][0]['name'], rawTagAndCounts[i][0]);
			assert.equal(femaleTagAndCounts[i][0]['isNegative'], false);
			assert.equal(femaleTagAndCounts[i][1], rawTagAndCounts[i][1]);
		}
	});

	test('search rejects invalid type', async function (): Promise<void> {
		const hitomi: Hitomi = createMock<Hitomi>({
			request: createMock<Hitomi['request']>(function (): never {
				throw new Error('request should not be called');
			})
		});
		const manager: TagManager = new TagManager(hitomi);

		await assert.rejects(function (): Promise<[Tag, number][]> {
			return manager.search('-company:frost_nova::');
		}, createError(ErrorCode['InvalidArgument'], /Type must be one of/));
	});

	test('list returns language and type tags without network request', async function (): Promise<void> {
		const hitomi: Hitomi = createMock<Hitomi>({
			request: createMock<Hitomi['request']>(function (): never {
				throw new Error('request should not be called');
			})
		});

		const manager: TagManager = new TagManager(hitomi);

		const languageTags: Tag[] = await manager.list('language');
		const typeTags: Tag[] = await manager.list('type');

		assert.equal(languageTags['length'], Language['ORDERED']['length']);
		assert.equal(typeTags['length'], Gallery['TYPES']['size']);
	});

	test('list requests and parses browsable tags', async function (): Promise<void> {
		const calls: RequestCall[] = [];
		const response: string = `<a href="/tag/1%20general%20tag-all.html">1 general tag</a>
		<a href="/tag/2%20general%20tag-all.html">2 general tag</a>
		<a href="/tag/male%3A3%20male%20tag-all.html">3 male tag ♂</a>
		<a href="/tag/female%3A4%20female%20tag-all.html">4 female tag ♀</a>`;

		const hitomi: Hitomi = createMock<Hitomi>({
			request: createMock<Hitomi['request']>(function (host: string, path: string, type: ResponseType, range?: string): string {
				calls.push({
					host: host,
					path: path,
					type: type,
					range: range
				});

				return response;
			})
		});
		const manager: TagManager = new TagManager(hitomi);

		const generalTags: Tag[] = await manager.list('tag', NameInitial._123);
		const maleTags: Tag[] = await manager.list('male', NameInitial._123);
		const femaleTags: Tag[] = await manager.list('female', NameInitial._123);

		assert.deepEqual(calls, [{
			host: 'hitomi.la',
			path: '/alltags-123.html',
			type: ResponseType['TEXT'],
			range: undefined
		},
		{
			host: 'hitomi.la',
			path: '/alltags-123.html',
			type: ResponseType['TEXT'],
			range: undefined
		},
		{
			host: 'hitomi.la',
			path: '/alltags-123.html',
			type: ResponseType['TEXT'],
			range: undefined
		}]);

		assert.equal(generalTags['length'], 2);
		assert.equal(generalTags[0]['type'], 'tag');
		assert.equal(generalTags[0]['name'], '1 general tag');
		assert.equal(generalTags[0]['isNegative'], false);
		assert.equal(generalTags[1]['type'], 'tag');
		assert.equal(generalTags[1]['name'], '2 general tag');
		assert.equal(generalTags[1]['isNegative'], false);

		assert.equal(maleTags['length'], 1);
		assert.equal(maleTags[0]['type'], 'male');
		assert.equal(maleTags[0]['name'], '3 male tag');
		assert.equal(maleTags[0]['isNegative'], false);

		assert.equal(femaleTags['length'], 1);
		assert.equal(femaleTags[0]['type'], 'female');
		assert.equal(femaleTags[0]['name'], '4 female tag');
		assert.equal(femaleTags[0]['isNegative'], false);
	});

	test('list rejects specific types without startsWith initial', async function (): Promise<void> {
		const hitomi: Hitomi = createMock<Hitomi>({});
		const manager: TagManager = new TagManager(hitomi);

		for(const type of PARTIAL_TAG_TYPES) {
			await assert.rejects(function (): Promise<Tag[]> {
				return manager.list(type);
			}, createError(ErrorCode['InvalidCombination'], /StartsWith must be provided except for language and type/));
		}
	});
});
