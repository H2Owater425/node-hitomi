import type { Hitomi } from './hitomi';
import { Image, Video } from './media';
import { Language, Tag } from './tag';
import { RESOURCE_DOMAIN, DEDICATED_TAG_PROPERTIES, SortType } from './utilities/constants';
import { defineProperties, hashTerm, formatOneOfState } from './utilities/functions';
import { Base, IndexProvider, HitomiError } from './utilities/structures';
import type { URL, Node } from './utilities/types';

/**
 * Represents the title of a gallery.
 * 
 * @see {@link Gallery}
 */
export class Title {
	// @internal
	constructor(
		/**
		 * The display title of the gallery.
		 * 
		 * @type {string}
		 * @readonly
		 */
		public readonly display: string,
		/**
		 * The Japanese title of the gallery.
		 * 
		 * @deprecated This field is always null.
		 * @type {string | null}
		 * @readonly
		 */
		public readonly japanese: string | null = null
	) {}
}

/**
 * Represents a reference to a gallery, identified by the id.
 * 
 * @see {@link Gallery}
 * @see {@link GalleryManager}
 */
export class GalleryReference extends Base {
	constructor(
		hitomi: Hitomi,
		/**
		 * The unique identifier of the gallery.
		 * 
		 * @type {number}
		 * @readonly
		 */
		public readonly id: number
	) {
		super(hitomi);
	}

	/**
	 * Retrieves the {@link Gallery} associated with the id.
	 * 
	 * @returns {Promise<Gallery>} A promise that resolves to the full {@link Gallery} instance.
	 */
	public retrieve(): Promise<Gallery> {
		return this['hitomi']['galleries'].retrieve(this['id']);
	}
}

/**
 * Represents a partial gallery associated with a specific language.
 * 
 * @see {@link Gallery}
 */
export class TranslatedGallery extends GalleryReference {
	// @internal
	constructor(
		hitomi: Hitomi,
		id: GalleryReference['id'],
		/**
		 * The language of the translated gallery. (`null` if unavailable)
		 * 
		 * @type {Language | null}
		 * @readonly
		 */
		public readonly language: Language | null,
		/**
		 * The URL path to the translated gallery.
		 * 
		 * @type {string}
		 * @readonly
		 */
		public readonly url: string
	) {
		super(hitomi, id);
	}
}

/**
 * Represents a complete gallery.
 * 
 * @see {@link GalleryManager}
 */
export class Gallery extends TranslatedGallery {
	// @internal
	constructor(
		hitomi: Hitomi,
		id: TranslatedGallery['id'],
		language: TranslatedGallery['language'],
		url: TranslatedGallery['url'],
		/**
		 * The title of the gallery.
		 * 
		 * @type {Title}
		 * @readonly
		 */
		public readonly title: Title,
		/**
		 * The type of the gallery.
		 * 
		 * @type {'doujinshi' | 'manga' | 'artistcg' | 'gamecg' | 'imageset' | 'anime'}
		 * @readonly
		 */
		public readonly type: 'doujinshi' | 'manga' | 'artistcg' | 'gamecg' | 'imageset' | 'anime',
		/**
		 * The artist tags associated with the gallery.
		 * 
		 * @type {readonly Tag[]}
		 * @readonly
		 */
		public readonly artists: readonly Tag[],
		/**
		 * The group tags associated with the gallery.
		 * 
		 * @type {readonly Tag[]}
		 * @readonly
		 */
		public readonly groups: readonly Tag[],
		/**
		 * The series (parody) tags associated with the gallery.
		 * 
		 * @type {readonly Tag[]}
		 * @readonly
		 */
		public readonly series: readonly Tag[],
		/**
		 * The character tags associated with the gallery.
		 * 
		 * @type {readonly Tag[]}
		 * @readonly
		 */
		public readonly characters: readonly Tag[],
		/**
		 * The general, male, and female tags associated with the gallery.
		 * 
		 * @type {readonly Tag[]}
		 * @readonly
		 */
		public readonly tags: readonly Tag[],
		/**
		 * The image files contained in the gallery.
		 * 
		 * @type {readonly Image[]}
		 * @readonly
		 */
		public readonly files: readonly Image[],
		/**
		 * The translations of the gallery in other languages.
		 * 
		 * @type {readonly TranslatedGallery[]}
		 * @readonly
		 */
		public readonly translations: readonly TranslatedGallery[],
		/**
		 * The references to related galleries.
		 * 
		 * @type {readonly GalleryReference[]}
		 * @readonly
		 */
		public readonly relations: readonly GalleryReference[],
		/**
		 * Whether the gallery is blocked.
		 * 
		 * @type {boolean}
		 * @readonly
		 */
		public readonly isBlocked: boolean,
		/**
		 * The date when the gallery was added.
		 * 
		 * @type {Date}
		 * @readonly
		 */
		public readonly addedDate: Date,
		/**
		 * The date when the gallery was published. (`null` if unavailable)
		 * 
		 * @type {Date | null}
		 * @readonly
		 */
		public readonly publishedDate: Date | null = null,
		/**
		 * The video associated with the gallery. (`null` if unavailable)
		 * 
		 * @type {Video | null}
		 * @readonly
		 */
		public readonly video: Video | null = null
	) {
		super(hitomi, id, language, url);
	}

	/**
	 * Returns all thumbnail images of the gallery.
	 * 
	 * @returns {[Image, Image]} A tuple containing the first and middle images.
	 */
	public getThumbnails(): [Image, Image] {
		return [this['files'][0], this['files'][Math.floor(this['files']['length'] / 2)]]
	}
}

/**
 * Manages retrieving and listing {@link Gallery} instances.
 *
 * @see {@link Hitomi}
 */
export class GalleryManager extends Base {
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
	 * Retrieves the {@link Gallery} with the specified id.
	 *
	 * @param {number} id The unique identifier of the gallery.
	 * @returns {Promise<Gallery>} A promise that resolves to the {@link Gallery} instance.
	 */
	public async retrieve(id: number): Promise<Gallery> {
		const rawGallery: {
			id: string;
			type: 'doujinshi' | 'manga' | 'artistcg' | 'gamecg' | 'anime';
			galleryurl: string;
			language: Language['name'] | null;
			language_localname: Language['localName'] | null;
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
				name: Language['name'];
				galleryid: number;
				language_localname: Language['localName'];
			}[];
			related: number[];
			blocked: number;
			date: string;
			datepublished: string | null;
			videofilename: string | null;
		} = JSON.parse(String(await this['hitomi'].request([RESOURCE_DOMAIN, '/galleries/' + id + '.js'])).slice(18));
		const dedicatedTags: [Tag[], Tag[], Tag[], Tag[]] = [[] /* artists */, [] /* groups */, [] /* series */, [] /* characters */];
		const tags: Tag[] = [];
		const files: Image[] = [];
		const translations: TranslatedGallery[] = [];

		let i: number = 0;
		let type: Tag['type'];

		for(; i < DEDICATED_TAG_PROPERTIES['length']; i++) {
			// @ts-expect-error - typescript internal error
			const dedicatedTagProperty: `${(typeof DEDICATED_TAG_PROPERTIES)[number]}s` = DEDICATED_TAG_PROPERTIES[i] + 's';

			type = i !== 2 ? DEDICATED_TAG_PROPERTIES[i] as Tag['type'] : 'series';

			if(rawGallery[dedicatedTagProperty]) {
				for(let j: number = 0; j < rawGallery[dedicatedTagProperty]['length']; j++)
					// @ts-expect-error - typescript internal error
					dedicatedTags[i].push(new Tag(this['hitomi'], type, rawGallery[dedicatedTagProperty][j][DEDICATED_TAG_PROPERTIES[i]]));
			}
		}

		for(i = 0; i < rawGallery['tags']['length']; i++) {
			type = 'tag';

			if(Boolean(rawGallery['tags'][i]['male'])) {
				type = 'male';
			} else if(Boolean(rawGallery['tags'][i]['female'])) {
				type = 'female';
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
				'/galleries/' + rawGallery['languages'][i]['galleryid'] + '.html'
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

	// nozomi uses jspack
	// @internal
	private static unpackIds(response: Buffer, isNegative: boolean = false): Set<Gallery['id']> {
		const ids: Set<Gallery['id']> = new Set<Gallery['id']>();

		for(let i: number = 0; i < response['byteLength']; i += 4) {
			ids.add(response.readInt32BE(i));
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
	} = {}): URL {
		const language: string = options['language'] || 'all';
		let orderBy: string = '';

		if(options['orderBy']) {
			switch(options['orderBy']) {
				case SortType['DatePublished']: {
					orderBy = 'date/published/';
				}
				case SortType['DateAdded']:
				// shuffle array later
				case 'random': {
					break;
				}

				case SortType['PopularityDay']:
				case SortType['PopularityWeek']:
				case SortType['PopularityMonth']:
				case SortType['PopularityYear']: {
					orderBy = 'popular/' + options['orderBy'] + '/';

					break;
				}

				default: {
					// @ts-expect-error
					throw new HitomiError('OrderBy', formatOneOfState(SortType));
				}
			}
		}

		if(!options['tag'] || options['tag']['type'] === 'language') {
			return [RESOURCE_DOMAIN, '/n/' + orderBy + 'index-' + language + '.nozomi'];
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
	 * Lists {@link GalleryReference} matching the specified search criteria.
	 *
	 * When `options.page` is provided, only one non-language tag (optionally paired with a language tag) is allowed, and negative tags are not allowed.
	 *
	 * When using `Popularity{Period}` for `options.orderBy`, the total number of galleries may vary.
	 *
	 * @param {object} [options] The search options.
	 * @param {Tag[]} [options.tags] An array of {@link Tag} instances to filter by.
	 * @param {string} [options.title] A title string to search for.
	 * @param {SortType} [options.orderBy=SortType.DateAdded] The {@link SortType} to order by. (`SortType.DateAdded` if omitted)
	 * @param {object} [options.page] Pagination options.
	 * @param {number} [options.page.index=0] The zero-based page index. (`0` if omitted and `options.page` is provided)
	 * @param {number} [options.page.size=25] The number of galleries per page. (`25` if omitted and `options.page` is provided)
	 * @returns {Promise<GalleryReference[]>} A promise that resolves to an array of {@link GalleryReference} instances.
	 * @throws {HitomiError} If `page` is used with multiple tags or a negative tag.
	 * @see {@link SortType}
	 */
	public async list(options: {
		tags?: Tag[];
		title?: string;
		orderBy?: SortType;
		page?: {
			index?: number;
			size?: number;
		};
	} = {}): Promise<GalleryReference[]> {
		const idSets: Set<Gallery['id']>[] = [];
		const isRandom: boolean = options['orderBy'] === 'random';
		let language: string | undefined;
		let i: number = 0;
		let range: string | undefined;

		if(options['page']) {
			const size: number = options['page']['size'] || 25;
			const start: number = options['page']['index'] ? options['page']['index'] * size : 0;

			range = start + '-' + (start + size - 1);
		}

		if(options['tags'] && options['tags']['length']) {
			// bring positive tags to front
			const tags: Tag[] = options['tags'].slice().sort(function (a: Tag, b: Tag): number {
				return (a['isNegative'] as unknown as number) - (b['isNegative'] as unknown as number);
			});

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
					throw new HitomiError('Page', 'used with multiple tags', false);
				}

				if(tags[tags['length'] - 1]['isNegative']) {
					throw new HitomiError('Page', 'used with negative tag', false);
				}

				return this.createReferences(GalleryManager.unpackIds(await this['hitomi'].request(GalleryManager.createNozomiUrl({
					tag: tags[+(tags[0]['type'] === 'language') /* selects non-language tag */],
					orderBy: options['orderBy'],
					language: language
				}), range)), isRandom);
			}

			idSets.push(GalleryManager.unpackIds(await this['hitomi'].request(GalleryManager.createNozomiUrl({
				tag: tags[i++] /* if first tag is negative i becomes -1, therefore tags give undefined  */,
				orderBy: options['orderBy'],
				language: language
			}))));

			for(; i < tags['length']; i++) {
				if(tags[i]['type'] !== 'language' || !language && tags[i]['isNegative']) {
					idSets.push(GalleryManager.unpackIds(await this['hitomi'].request(GalleryManager.createNozomiUrl({
						tag: tags[i],
						language: language
					})), tags[i]['isNegative']));
				}
			}
		} else {
			const urn: URL = GalleryManager.createNozomiUrl({
				orderBy: options['orderBy']
			});

			if(range) {
				return this.createReferences(GalleryManager.unpackIds(await this['hitomi'].request(urn, range)), isRandom);
			}

			if(options['orderBy']) {
				idSets.push(GalleryManager.unpackIds(await this['hitomi'].request(urn)));
			}
		}

		if(options['title'] && options['title']['length']) {
			const version: string = await this['index'].retrieve();
			const title: string = options['title'].toLowerCase() + ' ';
			const rootNode: Node | undefined = await this['index'].getNodeAtAddress(0n, version);

			if(!rootNode) {
				throw HitomiError['ROOT_NODE_EMPTY'];
			}

			i /* currentIndex */ = 0;
			let j /* nextIndex */: number = title.indexOf(' ');
			let data: Node[1][number] | undefined;

			while(j !== -1) {
				if(j - i) {
					data = await this['index'].binarySearch(hashTerm(title.slice(i, j)), rootNode, version);

					if(!data) {
						return [];
					}

					idSets.push(GalleryManager.unpackIds(await this['hitomi'].request([RESOURCE_DOMAIN, '/galleriesindex/galleries.' + version + '.data'], (data[0] + 4n) + '-' + (data[0] + BigInt(data[1]) - 1n))));
				}

				i = j + 1;
				j = title.indexOf(' ', i);
			}
		}

		let isNegative: boolean;

		if(idSets['length']) {
			for(i = 1; i < idSets['length']; i++) {
				if(!idSets[0]['size']) {
					return [];
				}

				isNegative = idSets[i].has(0);

				for(const id of idSets[0]) {
					if(isNegative === idSets[i].has(id)) {
						idSets[0].delete(id);
					}
				}
			}
		} else {
			idSets.push(GalleryManager.unpackIds(await this['hitomi'].request(GalleryManager.createNozomiUrl())));
		}

		return this.createReferences(idSets[0], isRandom);
	}
}