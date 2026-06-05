import { ResponseType } from '@platform';
import { ErrorCode, HitomiError } from '../structures/error';
import { Gallery, TranslatedGallery, GalleryReference, Title } from '../structures/gallery';
import type { Hitomi } from '../hitomi';
import { RESOURCE_DOMAIN } from '../internal/constants';
import { defineProperties } from '../internal/functions';
import { IndexProvider } from '../internal/provider';
import { Base } from '../internal/base';
import type { Node } from '../internal/types';
import { Image, Video } from '../structures/media';
import { Tag, Language } from '../structures/tag';

/**
 * Sort orders for listing galleries.
 *
 * @readonly
 * @enum {string}
 * @see {@link GalleryOptions.orderBy}
 */
export enum SortType {
	DateAdded = 'added',
	DatePublished = 'published',
	Random = 'random',
	PopularityDay = 'today',
	PopularityWeek = 'week',
	PopularityMonth = 'month',
	PopularityYear = 'year'
}

/**
 * Pagination options for listing galleries.
 *
 * @see {@link GalleryOptions.page}
 */
export interface PageOptions {
	/**
	 * Zero-based page index.
	 *
	 * @default 0
	 */
	index?: number;
	/**
	 * Number of galleries per page.
	 *
	 * @default 25
	 */
	size?: number;
}

/**
 * Search and filter options for listing galleries.
 *
 * @see {@link GalleryManager.list}
 */
export interface GalleryOptions {
	/**
	 * Tags to filter results by.
	 */
	tags?: Tag[];
	/**
	 * The title keyword to search for.
	 */
	title?: string;
	/**
	 * The sort type to order by.
	 *
	 * @default SortType.DateAdded
	 */
	orderBy?: SortType;
	/**
	 * Pagination options.
	 */
	page?: PageOptions;
}

/**
 * A manager for retrieving and listing galleries.
 *
 * @see {@link Hitomi}
 */
export class GalleryManager extends Base {
	// @internal
	private static readonly RAW_TYPES: readonly ['artist', 'group', 'parody', 'character'] = ['artist', 'group', 'parody', 'character'];

	// @internal
	private readonly index!: IndexProvider;

	// @internal
	constructor(hitomi: Hitomi) {
		super(hitomi);

		defineProperties(this, {
			index: new IndexProvider(hitomi, 'galleries')
		});
	}

	/**
	 * Retrieves a {@link Gallery} by its unique identifier.
	 *
	 * @param {number} id The unique gallery identifier.
	 * @returns {Promise<Gallery>} A `Promise` that resolves to the matching {@link Gallery}.
	 */
	public async retrieve(id: number): Promise<Gallery> {
		const rawGallery: {
			id: string;
			type: 'doujinshi' | 'manga' | 'artistcg' | 'gamecg' | 'anime';
			galleryurl: string;
			language: string | null;
			language_localname: string | null;
			title: string;
			japanese_title: string | null;
			artists: {
				artist: string;
			}[] | null;
			groups: {
				group: string;
			}[] | null;
			parodys: {
				parody: string;
			}[] | null;
			characters: {
				character: string;
			}[] | null;
			tags: {
				tag: string;
				male?: string | number;
				female?: string | number;
			}[];
			files: {
				hash: string;
				name: string;
				width: number;
				height: number;
				hasavif?: number;
			}[];
			languages: {
				galleryid: number;
				name: string;
				language_localname: string;
				url: string;
			}[];
			related: number[];
			blocked: number;
			date: string;
			datepublished: string | null;
			videofilename: string | null;
		} = JSON.parse((await this['hitomi'].request(RESOURCE_DOMAIN, '/galleries/' + id + '.js', ResponseType['TEXT'])).slice(18));
		const dedicatedTags: [Tag[], Tag[], Tag[], Tag[]] = [[] /* artists */, [] /* groups */, [] /* series */, [] /* characters */];
		const tags: Tag[] = [];
		const files: Image[] = [];
		const translations: TranslatedGallery[] = [];

		let i: number = 0;
		let type: Tag['type'];

		for(; i < GalleryManager['RAW_TYPES']['length']; i++) {
			// @ts-expect-error - Typescript internal error
			const rawPluralType: `${(typeof GalleryManager['RAW_TYPES'])[number]}s` = GalleryManager['RAW_TYPES'][i] + 's';

			type = i !== 2 ? GalleryManager['RAW_TYPES'][i] as Tag['type'] : 'series';

			if(rawGallery[rawPluralType]) {
				for(let j: number = 0; j < rawGallery[rawPluralType]['length']; j++)
					// @ts-expect-error - Typescript internal error
					dedicatedTags[i].push(new Tag(this['hitomi'], type, rawGallery[rawPluralType][j][GalleryManager['RAW_TYPES'][i]]));
			}
		}

		for(i = 0; i < rawGallery['tags']['length']; i++) {
			if(Boolean(rawGallery['tags'][i]['male'])) {
				type = 'male';
			} else if(Boolean(rawGallery['tags'][i]['female'])) {
				type = 'female';
			} else {
				type = 'tag';
			}

			tags.push(new Tag(this['hitomi'], type, rawGallery['tags'][i]['tag'], false));
		}

		const thumbnailIndex: number = Math.floor(rawGallery['files']['length'] / 2);

		for(i = 0; i < rawGallery['files']['length']; i++) {
			files.push(new Image(
				this['hitomi'],
				rawGallery['files'][i]['width'],
				rawGallery['files'][i]['height'],
				rawGallery['files'][i]['hash'],
				rawGallery['files'][i]['name'],
				Boolean(rawGallery['files'][i]['hasavif']),
				true,
				false,
				!i || i === thumbnailIndex
			));
		}

		for(i = 0; i < rawGallery['languages']['length']; i++) {
			translations.push(new TranslatedGallery(
				this['hitomi'],
				rawGallery['languages'][i]['galleryid'],
				new Language(
					this['hitomi'],
					rawGallery['languages'][i]['name'],
					rawGallery['languages'][i]['language_localname']
				),
				rawGallery['languages'][i]['url']
			));
		}

		const relations: GalleryReference[] = [];

		for(i = 0; i < rawGallery['related']['length']; i++) {
			relations.push(new GalleryReference(this['hitomi'], rawGallery['related'][i]));
		}

		return new Gallery(
			this['hitomi'],
			+rawGallery['id'],
			rawGallery['language'] ? new Language(
				this['hitomi'],
				rawGallery['language'],
				rawGallery['language_localname'] as Language['localName']
			) : null,
			// galleries with rearranged ids have strange urls
			rawGallery['galleryurl'],
			new Title(rawGallery['title'], rawGallery['japanese_title']),
			rawGallery['type'],
			dedicatedTags[0],
			dedicatedTags[1],
			dedicatedTags[2],
			dedicatedTags[3],
			tags,
			files,
			translations,
			relations,
			Boolean(rawGallery['blocked']),
			new Date(rawGallery['date']),
			rawGallery['datepublished'] ? new Date(rawGallery['datepublished']) : null,
			rawGallery['videofilename'] ? new Video(this['hitomi'], files[1]['width'], files[1]['height'], rawGallery['videofilename'], files[1]['hash']) : null
		);
	}

	// @internal
	private async requestIds(url: [string, string], range?: string, isNegative: boolean = false): Promise<Set<Gallery['id']>> {
		const view: DataView = await this['hitomi'].request(url[0], url[1], ResponseType['VIEW'], range);
		const ids: Set<Gallery['id']> = new Set<Gallery['id']>();

		for(let i: number = 0; i < view['byteLength']; i += 4) {
			ids.add(view.getInt32(i));
		}

		if(isNegative) {
			// negative flag
			ids.add(0);
		}

		return ids;
	}

	// @internal
	private static createNozomiUrl(options: {
		tag?: Tag;
		language?: string;
		orderBy?: SortType;
	} = {}): [string, string] {
		const language: string = options['language'] || 'all';
		let orderBy: string = '';

		if(options['orderBy']) {
			switch(options['orderBy']) {
				case SortType['DatePublished']: {
					orderBy = 'date/published';
				}
				case SortType['DateAdded']:
				// shuffle array later
				case SortType['Random']: {
					break;
				}

				case SortType['PopularityDay']:
				case SortType['PopularityWeek']:
				case SortType['PopularityMonth']:
				case SortType['PopularityYear']: {
					orderBy = 'popular/' + options['orderBy'];

					break;
				}

				default: {
					// @ts-expect-error
					throw HitomiError.invalidMember('OrderBy', SortType);
				}
			}
		}

		if(!options['tag'] || options['tag']['type'] === 'language') {
			return [RESOURCE_DOMAIN, '/n/' + (orderBy || 'index') + '-' + language + '.nozomi'];
		}

		if(orderBy) {
			orderBy += '/';
		}

		let area: string;

		switch(options['tag']['type']) {
			case 'male':
			case 'female': {
				area = 'tag/';
				orderBy += options['tag']['type'] + ':';

				break;
			}

			default: {
				area = options['tag']['type'] + '/';
			}
		}

		return [RESOURCE_DOMAIN, '/n/' + area + orderBy + encodeURIComponent(options['tag']['name']) + '-' + language + '.nozomi'];
	}

	// @internal
	private createReferences(ids: Set<number>, shouldShuffle: boolean): GalleryReference[] {
		const references: GalleryReference[] = [];

		for(const id of ids) {
			references.push(new GalleryReference(this['hitomi'], id));
		}

		if(shouldShuffle) {
			let currentIndex: number = references['length'];
			let targetIndex: number;

			while(currentIndex) {
				targetIndex = Math.floor(Math.random() * currentIndex--);

				const temporary: GalleryReference = references[targetIndex];

				references[targetIndex] = references[currentIndex];
				references[currentIndex] = temporary;
			}
		}

		return references;
	}

	/**
	 * Lists galleries as {@link GalleryReference} matching the specified search criteria.
	 *
	 * When `options.page` is provided, only one non-language tag (optionally combined with a language tag) is allowed, and negative tags are not supported.
	 *
	 * When using a popularity-based sort in `options.orderBy`, the number of returned galleries may vary.
	 *
	 * @param {GalleryOptions} [options] The search and filter options.
	 * @returns {Promise<GalleryReference[]>} A `Promise` that resolves to matching galleries as {@link GalleryReference}.
	 * @throws {HitomiError} If `page` is used with multiple tags or any negative tag.
	 * @see {@link SortType}
	 */
	public async list(options: GalleryOptions = {}): Promise<GalleryReference[]> {
		const idSets: Set<Gallery['id']>[] = [];
		const isRandom: boolean = options['orderBy'] === SortType['Random'];
		let language: string | undefined;
		let i: number = 0;
		let range: string | undefined;

		if(options['page']) {
			const size: number = options['page']['size'] ? options['page']['size'] * 4 : 100;
			const start: number = options['page']['index'] ? options['page']['index'] * size : 0;

			range = start + '-' + (start + size - 1);
		}

		if(options['tags'] && options['tags']['length']) {
			// bring positive tags to front
			const tags: Tag[] = options['tags'].slice().sort(Tag.compare);

			if(tags[0]['isNegative']) {
				i = -1;
			} else {
				for(; i < tags['length'] && !tags[i]['isNegative']; i++) {
					if(tags[i]['type'] === 'language') {
						language = tags[i]['name'];

						break;
					}
				}

				i = 0;
			}

			if(range) {
				if(tags['length'] > 2 || tags['length'] === 2 && !language) {
					throw new HitomiError(ErrorCode['InvalidCombination'], 'Page', 'used with multiple tags', false);
				}

				if(tags[tags['length'] - 1]['isNegative']) {
					throw new HitomiError(ErrorCode['InvalidCombination'], 'Page', 'used with negative tag', false);
				}

				return this.createReferences(await this.requestIds(GalleryManager.createNozomiUrl({
					tag: tags[+(tags[0]['type'] === 'language') /* selects non-language tag */],
					orderBy: options['orderBy'],
					language: language
				}), range), isRandom);
			}

			idSets.push(await this.requestIds(GalleryManager.createNozomiUrl({
				tag: tags[i++] /* if first tag is negative i becomes -1, therefore tags give undefined  */,
				orderBy: options['orderBy'],
				language: language
			})));

			for(; i < tags['length']; i++) {
				if(tags[i]['type'] !== 'language' || !language && tags[i]['isNegative']) {
					idSets.push(await this.requestIds(GalleryManager.createNozomiUrl({
						tag: tags[i],
						language: language
					}), undefined, tags[i]['isNegative']));
				}
			}
		} else {
			const url: [string, string] = GalleryManager.createNozomiUrl({
				orderBy: options['orderBy']
			});

			if(range) {
				return this.createReferences(await this.requestIds(url, range), isRandom);
			}

			if(options['orderBy']) {
				idSets.push(await this.requestIds(url));
			}
		}

		if(options['title'] && options['title']['length']) {
			const version: string = await this['index'].retrieve();
			const title: string = options['title'].toLowerCase() + ' ';
			const rootNode: Node | undefined = await this['index'].getNodeAtAddress(0n, version);

			if(!rootNode) {
				throw HitomiError['emptyRootNode'];
			}

			i /* currentIndex */ = 0;
			let j /* nextIndex */: number = title.indexOf(' ');

			while(j !== -1) {
				if(j - i) {
					const data: Node[1][number] | undefined = await this['index'].binarySearch(await this['hitomi'].hash(title.slice(i, j)), rootNode, version);

					if(!data) {
						return [];
					}

					idSets.push(await this.requestIds([RESOURCE_DOMAIN, '/galleriesindex/galleries.' + version + '.data'], (data[0] + 4n) + '-' + (data[0] + BigInt(data[1]) - 1n)));
				}

				i = j + 1;
				j = title.indexOf(' ', i);
			}
		}

		if(idSets['length']) {
			for(i = 1; i < idSets['length']; i++) {
				if(!idSets[0]['size']) {
					return [];
				}

				const isNegative: boolean = idSets[i].has(0);

				for(const id of idSets[0]) {
					if(isNegative === idSets[i].has(id)) {
						idSets[0].delete(id);
					}
				}
			}
		} else {
			idSets.push(await this.requestIds(GalleryManager.createNozomiUrl()));
		}

		return this.createReferences(idSets[0], isRandom);
	}
}