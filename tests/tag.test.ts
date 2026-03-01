import { describe, test } from 'mocha';
import assert from 'assert';

import { Language, Tag, TagManager } from '../source/tag';
import { NameInitial, BINARY_ORDERED_LANGUAGES, GALLERY_TYPES, LANGUAGE_NAMES } from '../source/utilities/constants';
import { Hitomi } from '../source/hitomi';
import type { Node, URL } from '../source/utilities/types';
import { assertInstanceOf, createMock } from './utilities/functions';
import { createHash } from 'crypto';
import { TAG_TYPES } from './utilities/constants';
import { IndexProvider } from '../source/utilities/structures';

describe('Language', function (): void {
	test('constructor exposes url and toTag converts to language tag', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});
		const language: Language = new Language(hitomi, 'english', 'English');
		const tag: Tag = language.toTag(true);

		assert.strictEqual(language['url'], '/index-english.html');

		assertInstanceOf(tag, Tag);
		assert.strictEqual(tag['type'], 'language');
		assert.strictEqual(tag['name'], 'english');
		assert.strictEqual(tag['isNegative'], true);
		assert.strictEqual(tag['url'], '/index-english.html');
	});

	test('constructor accepts all known language tuples', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});

		for(let i: number = 0; i < BINARY_ORDERED_LANGUAGES['length']; i++) {
			const language: Language = new Language(hitomi, BINARY_ORDERED_LANGUAGES[i][0], BINARY_ORDERED_LANGUAGES[i][1]);
	
			assert.strictEqual(language['name'], BINARY_ORDERED_LANGUAGES[i][0]);
			assert.strictEqual(language['localName'], BINARY_ORDERED_LANGUAGES[i][1]);
			assert.strictEqual(language['url'], '/index-' + BINARY_ORDERED_LANGUAGES[i][0] + '.html');
		}
	});
});

describe('Tag', function (): void {
	test('constructor accepts all known names for language type', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});

		for(const name of LANGUAGE_NAMES) {
			const tag: Tag = new Tag(hitomi, 'language', name);

			assert.strictEqual(tag['type'], 'language');
			assert.strictEqual(tag['name'], name);
			assert.strictEqual(tag['url'], '/index-' + name + '.html');
		}
	});

	test('constructor accepts all known names for type tag', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});

		for(const type of GALLERY_TYPES) {
			const tag: Tag = new Tag(hitomi, 'type', type);

			assert.strictEqual(tag['type'], 'type');
			assert.strictEqual(tag['name'], type);
			assert.strictEqual(tag['url'], '/type/' + encodeURIComponent(type) + '-all.html');
		}
	});

	test('constructor accepts known non-language and non-type tags', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});

		for(let i: number = 0; i < TAG_TYPES['length']; i++) {
			const name: string = TAG_TYPES[i] + ' tag';
			const tag: Tag = new Tag(hitomi, TAG_TYPES[i], name);
			let url: string;

			switch(TAG_TYPES[i]) {
				case 'male':
				case 'female': {
					url = '/tag/' + TAG_TYPES[i] + '%3A';
	
					break;
				}

				default: {
					url = '/' + TAG_TYPES[i] + '/'; 
				}
			}

			assert.strictEqual(tag['type'], TAG_TYPES[i]);
			assert.strictEqual(tag['name'], name);
			assert.strictEqual(tag['url'], url + encodeURIComponent(name) + '-all.html');
		}
	})

	test('constructor rejects invalid inputs', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});

		assert.throws(function (): void {
			// @ts-expect-error
			new Tag(hitomi, 'company', 'frost nova');
		}, /Type must be one of/);
		assert.throws(function (): void {
			new Tag(hitomi, 'language', 'typescript');
		}, /Name must be one of/);
		assert.throws(function (): void {
			new Tag(hitomi, 'type', 'encyclopedia');
		}, /Name must be one of/);
	});
	
	test('constructor sets generated url', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});
		const maleTag: Tag = new Tag(hitomi, 'male', 'male tag');
		const artistTag: Tag = new Tag(hitomi, 'artist', 'artist tag');
		
		assert.strictEqual(maleTag['url'], '/tag/male%3Amale%20tag-all.html');
		assert.strictEqual(artistTag['url'], '/artist/artist%20tag-all.html');
	});
	
	test('toString returns formatted expression', function (): void {
		const hitomi: Hitomi = createMock<Hitomi>({});
		const tag: Tag = new Tag(hitomi, 'tag', 'general tag', true);

		assert.strictEqual(tag.toString(), '-tag:general_tag');
		assert.strictEqual(tag.toString(false), 'tag:general_tag');
	})

	test('listLanguages returns direct mapping for language tag without index access', async function (): Promise<void> {
		const hitomi: Hitomi = createMock<Hitomi>({
			languageIndex: createMock<IndexProvider>({
				retrieve: async function (): Promise<string> {
					throw new Error('retrieve should not be called');
				},
				getNodeAtAddress: async function (): Promise<Node | undefined> {
					throw new Error('getNodeAtAddress should not be called');
				},
				binarySearch: async function (): Promise<Node[1][number] | undefined> {
					throw new Error('binarySearch should not be called');
				}
			})
		});
		const tag: Tag = new Tag(hitomi, 'language', 'japanese');

		const languages: Language[] = await tag.listLanguages();

		assert.strictEqual(languages['length'], 1);
		assert.strictEqual(languages[0]['name'], 'japanese');
		assert.strictEqual(languages[0]['localName'], '日本語');
	});

	test('listLanguages uses language index for non-language tags', async function (): Promise<void> {
		const rootNode: Node = [[Buffer.alloc(0)], [[1n, 2]], [3n]];
		const version: string = '12345678';
		const calls: {
			function: string;
			address?: bigint;
			version?: string;
			key?: Buffer;
			root?: Node;
		}[] = []; 
		const hitomi: Hitomi = createMock<Hitomi>({
			languageIndex: createMock<IndexProvider>({
				retrieve: async function (): Promise<string> {
					calls.push({
						function: 'retrieve'
					});

					return version;
				},
				getNodeAtAddress: async function (address: bigint, version: string): Promise<Node> {
					calls.push({
						function: 'getNodeAtAddress',
						address: address,
						version: version
					});

					return rootNode;
				},
				binarySearch: async function (key: Buffer, root: Node, version: string): Promise<Node[1][number]> {
					calls.push({
						function: 'binarySearch',
						key: key,
						root: root,
						version: version
					});

					return [13n, 0];
				}
			})
		});
		const tag: Tag = new Tag(hitomi, 'female', 'glasses');

		const languages: Language[] = await tag.listLanguages();

		assert.deepStrictEqual(calls, [{
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

		const binaryOrderedLanguages: (typeof BINARY_ORDERED_LANGUAGES)[number][] = [
			BINARY_ORDERED_LANGUAGES[0],
			BINARY_ORDERED_LANGUAGES[2],
			BINARY_ORDERED_LANGUAGES[3]
		];

		for(let i: number = 0; i < languages['length']; i++) {
			assert.deepEqual(languages[i]['name'], binaryOrderedLanguages[i][0]);
			assert.deepEqual(languages[i]['localName'], binaryOrderedLanguages[i][1]);
		}
	});
});

describe('TagManager', function (): void {
	test('create and parse support underscores, negatives, and deduplication', function (): void {
		const manager: TagManager = new TagManager(createMock<Hitomi>({}));

		manager.create('character', 'character_tag');

		const tags: Tag[] = manager.parse('artist:artist_tag -tag:general_tag invalid artist:artist_tag');

		assert.strictEqual(tags['length'], 2);

		assert.strictEqual(tags[0]['type'], 'artist');
		assert.strictEqual(tags[0]['name'], 'artist tag');
		assert.strictEqual(tags[0]['isNegative'], false);


		assert.strictEqual(tags[1]['type'], 'tag');
		assert.strictEqual(tags[1]['name'], 'general tag');
		assert.strictEqual(tags[1]['isNegative'], true);
	});

	test('create rejects invalid type and empty name', function (): void {
		const manager: TagManager = new TagManager(createMock<Hitomi>({}));

		assert.throws(function (): void {
			// @ts-expect-error
			manager.create('species', 'ghost');
		}, /Type must be one of/);

		assert.throws(function (): void {
			manager.create('tag', '');
		}, /Name must not be empty/);
	});

	test('search builds request path and maps response pairs', async function (): Promise<void> {
		const calls: {
			url: URL,
			range: string | undefined
		}[] = [];
		const rawResults: [string, number, string][] = [
			['swimsuit', 70000, 'female'],
			['sweating', 50000, 'female']
		];
		const hitomi: Hitomi = createMock<Hitomi>({
			request: async function (url: URL, range?: string): Promise<Buffer> {
				calls.push({
					url: url,
					range: range
				});

				return Buffer.from(JSON.stringify(rawResults));
			}
		});
		const manager: TagManager = new TagManager(hitomi);

		const results: [Tag, number][] = await manager.search('-female:sw::');

		assert.deepStrictEqual(calls, [{
			url: ['tagindex.hitomi.la', 'female/s/w.json'],
			range: undefined
		}]);

		assert.strictEqual(results['length'], rawResults['length']);

		for(let i: number = 0; i < results['length']; i++) {
			assertInstanceOf(results[i][0], Tag);
			assert.strictEqual(results[i][0]['type'], rawResults[i][2]);
			assert.strictEqual(results[i][0]['name'], rawResults[i][0]);
			assert.strictEqual(results[i][0]['isNegative'], false);
			assert.strictEqual(results[i][1], rawResults[i][1]);
		}
	});

	test('list returns language and type tags without network request', async function (): Promise<void> {
		const hitomi: Hitomi = createMock<Hitomi>({
			request: async function (): Promise<Buffer> {
				throw new Error('request should not be called');
			}
		});

		const manager: TagManager = new TagManager(hitomi);

		const languageTags: Tag[] = await manager.list('language');
		const typeTags: Tag[] = await manager.list('type');

		assert.strictEqual(languageTags['length'], BINARY_ORDERED_LANGUAGES['length']);
		assert.strictEqual(typeTags['length'], GALLERY_TYPES['size']);
	});

	test('list requests and parses browsable tags', async function (): Promise<void> {
		const calls: {
			url: URL;
			range: string | undefined;
		}[] = [];
		const response: string = `<a href="/tag/1%20general%20tag-all.html">1 general tag</a>
		<a href="/tag/2%20general%20tag-all.html">2 general tag</a>
		<a href="/tag/male%3A3%20male%20tag-all.html">3 male tag ♂</a>
		<a href="/tag/female%3A4%20female%20tag-all.html">4 female tag ♀</a>`;

		const hitomi: Hitomi = createMock<Hitomi>({
			request: async function (url: URL, range?: string): Promise<Buffer> {
				calls.push({
					url: url,
					range: range
				});

				return Buffer.from(response);
			}
		});
		const manager: TagManager = new TagManager(hitomi);

		const generalTags: Tag[] = await manager.list('tag', NameInitial._123);
		const maleTags: Tag[] = await manager.list('male', NameInitial._123);
		const femaleTags: Tag[] = await manager.list('female', NameInitial._123);

		assert.deepStrictEqual(calls, [{
			url: ['hitomi.la', '/alltags-123.html'],
			range: undefined
		},
		{
			url: ['hitomi.la', '/alltags-123.html'],
			range: undefined
		},
		{
			url: ['hitomi.la', '/alltags-123.html'],
			range: undefined
		}]);

		assert.strictEqual(generalTags['length'], 2);
		assert.strictEqual(generalTags[0]['type'], 'tag');
		assert.strictEqual(generalTags[0]['name'], '1 general tag');
		assert.strictEqual(generalTags[0]['isNegative'], false);
		assert.strictEqual(generalTags[1]['type'], 'tag');
		assert.strictEqual(generalTags[1]['name'], '2 general tag');
		assert.strictEqual(generalTags[1]['isNegative'], false);

		assert.strictEqual(maleTags['length'], 1);
		assert.strictEqual(maleTags[0]['type'], 'male');
		assert.strictEqual(maleTags[0]['name'], '3 male tag');
		assert.strictEqual(maleTags[0]['isNegative'], false);

		assert.strictEqual(femaleTags['length'], 1);
		assert.strictEqual(femaleTags[0]['type'], 'female');
		assert.strictEqual(femaleTags[0]['name'], '4 female tag');
		assert.strictEqual(femaleTags[0]['isNegative'], false);
	});

	test('list rejects specific types without startsWith initial', async function (): Promise<void> {
		const hitomi: Hitomi = createMock<Hitomi>({});
		const manager: TagManager = new TagManager(hitomi);

		for(let i: number = 0; i < TAG_TYPES['length']; i++) {
			await assert.rejects(async function (): Promise<Tag[]> {
				return manager.list(TAG_TYPES[i]);
			}, /StartsWith must be provided except for language and type/);
		}
	});
});
