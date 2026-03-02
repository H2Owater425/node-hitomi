import type { Hitomi } from "./hitomi";
import { Image, Video } from "./media";
import { Language, Tag } from "./tag";
import {
  RESOURCE_DOMAIN,
  DEDICATED_TAG_PROPERTIES,
  SortType,
} from "./utilities/constants";
import {
  defineProperties,
  hashTerm,
  formatOneOfState,
} from "./utilities/functions";
import { Base, IndexProvider, HitomiError } from "./utilities/structures";
import type { URL, Node } from "./utilities/types";

/**
 * Title associated with a gallery.
 *
 * @see {@link Gallery}
 */
export class Title {
  // @internal
  constructor(
    /**
     * Display title of the gallery.
     *
     * @type {string}
     * @readonly
     */
    public readonly display: string,
    /**
     * Japanese title of the gallery.
     *
     * @deprecated This field is always null.
     * @type {string | null}
     * @readonly
     */
    public readonly japanese: string | null = null,
  ) {}
}

/**
 * Reference to a gallery with a unique identifier.
 *
 * @see {@link Gallery}
 * @see {@link GalleryManager}
 */
export class GalleryReference extends Base {
  constructor(
    hitomi: Hitomi,
    /**
     * Unique identifier of the gallery.
     *
     * @type {number}
     * @readonly
     */
    public readonly id: number,
  ) {
    super(hitomi);
  }

  /**
   * Retrieves a full {@link Gallery} associated with the unique identifier.
   *
   * @returns {Promise<Gallery>} Promise that resolves to a full {@link Gallery} instance.
   */
  public retrieve(): Promise<Gallery> {
    return this["hitomi"]["galleries"].retrieve(this["id"]);
  }
}

/**
 * Partial gallery for a specific language.
 *
 * @see {@link Gallery}
 */
export class TranslatedGallery extends GalleryReference {
  // @internal
  constructor(
    hitomi: Hitomi,
    id: GalleryReference["id"],
    /**
     * Language of the gallery. (`null` if unavailable)
     *
     * @type {Language | null}
     * @readonly
     */
    public readonly language: Language | null,
    /**
     * URL path of the gallery.
     *
     * @type {string}
     * @readonly
     */
    public readonly url: string,
  ) {
    super(hitomi, id);
  }
}

/**
 * Full gallery with metadata, files, and relationships.
 *
 * @see {@link GalleryManager}
 */
export class Gallery extends TranslatedGallery {
  // @internal
  constructor(
    hitomi: Hitomi,
    id: TranslatedGallery["id"],
    language: TranslatedGallery["language"],
    url: TranslatedGallery["url"],
    /**
     * Title of the gallery.
     *
     * @type {Title}
     * @readonly
     */
    public readonly title: Title,
    /**
     * Type of the gallery.
     *
     * @type {'doujinshi' | 'manga' | 'artistcg' | 'gamecg' | 'imageset' | 'anime'}
     * @readonly
     */
    public readonly type:
      | "doujinshi"
      | "manga"
      | "artistcg"
      | "gamecg"
      | "imageset"
      | "anime",
    /**
     * Artist tags associated with the gallery.
     *
     * @type {readonly Tag[]}
     * @readonly
     */
    public readonly artists: readonly Tag[],
    /**
     * Group tags associated with the gallery.
     *
     * @type {readonly Tag[]}
     * @readonly
     */
    public readonly groups: readonly Tag[],
    /**
     * Series (parody) tags associated with the gallery.
     *
     * @type {readonly Tag[]}
     * @readonly
     */
    public readonly series: readonly Tag[],
    /**
     * Character tags associated with the gallery.
     *
     * @type {readonly Tag[]}
     * @readonly
     */
    public readonly characters: readonly Tag[],
    /**
     * General, male, and female tags associated with the gallery.
     *
     * @type {readonly Tag[]}
     * @readonly
     */
    public readonly tags: readonly Tag[],
    /**
     * Image files in the gallery.
     *
     * @type {readonly Image[]}
     * @readonly
     */
    public readonly files: readonly Image[],
    /**
     * Available translations in other languages.
     *
     * @type {readonly TranslatedGallery[]}
     * @readonly
     */
    public readonly translations: readonly TranslatedGallery[],
    /**
     * References to related galleries.
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
     * Date when the gallery was added.
     *
     * @type {Date}
     * @readonly
     */
    public readonly addedDate: Date,
    /**
     * Date when the original work was published. (`null` if unavailable)
     *
     * @type {Date | null}
     * @readonly
     */
    public readonly publishedDate: Date | null = null,
    /**
     * Video resource associated with the gallery. (`null` if unavailable)
     *
     * @type {Video | null}
     * @readonly
     */
    public readonly video: Video | null = null,
  ) {
    super(hitomi, id, language, url);
  }

  /**
   * Returns representative thumbnails.
   *
   * @returns {[Image, Image]} Tuple containing the first and middle image.
   */
  public getThumbnails(): [Image, Image] {
    return [
      this["files"][0],
      this["files"][Math.floor(this["files"]["length"] / 2)],
    ];
  }
}

/**
 * Manager for retrieving and listing {@link Gallery} instances.
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
      index: new IndexProvider(hitomi, "galleries"),
    });
  }

  /**
   * Retrieves a {@link Gallery} by a unique identifier.
   *
   * @param {number} id Unique gallery identifier.
   * @returns {Promise<Gallery>} Promise that resolves to a {@link Gallery} instance.
   */
  public async retrieve(id: number): Promise<Gallery> {
    const rawGallery: {
      id: string;
      type: "doujinshi" | "manga" | "artistcg" | "gamecg" | "anime";
      galleryurl: string;
      language: string | null;
      language_localname: string | null;
      title: string;
      japanese_title: string | null;
      artists:
        | {
            artist: string;
          }[]
        | null;
      groups:
        | {
            group: string;
          }[]
        | null;
      parodys:
        | {
            parody: string;
          }[]
        | null;
      characters:
        | {
            character: string;
          }[]
        | null;
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
    } = JSON.parse(
      String(
        await this["hitomi"].request([
          RESOURCE_DOMAIN,
          "/galleries/" + id + ".js",
        ]),
      ).slice(18),
    );
    const dedicatedTags: [Tag[], Tag[], Tag[], Tag[]] = [
      [] /* artists */,
      [] /* groups */,
      [] /* series */,
      [] /* characters */,
    ];
    const tags: Tag[] = [];
    const files: Image[] = [];
    const translations: TranslatedGallery[] = [];

    let i: number = 0;
    let type: Tag["type"];

    for (; i < DEDICATED_TAG_PROPERTIES["length"]; i++) {
      // @ts-expect-error - typescript internal error
      const dedicatedTagProperty: `${(typeof DEDICATED_TAG_PROPERTIES)[number]}s` =
        DEDICATED_TAG_PROPERTIES[i] + "s";

      type = i !== 2 ? (DEDICATED_TAG_PROPERTIES[i] as Tag["type"]) : "series";

      const items = rawGallery[dedicatedTagProperty];

      if (items) {
        for (let j: number = 0; j < items["length"]; j++) {
          dedicatedTags[i].push(
            new Tag(
              this["hitomi"],
              type,
              (items[j] as Record<string, string>)[DEDICATED_TAG_PROPERTIES[i]],
            ),
          );
        }
      }
    }

    for (i = 0; i < rawGallery["tags"]["length"]; i++) {
      if (Boolean(rawGallery["tags"][i]["male"])) {
        type = "male";
      } else if (Boolean(rawGallery["tags"][i]["female"])) {
        type = "female";
      } else {
        type = "tag";
      }

      tags.push(
        new Tag(this["hitomi"], type, rawGallery["tags"][i]["tag"], false),
      );
    }

    const thumbnailIndex: number = Math.floor(
      rawGallery["files"]["length"] / 2,
    );

    for (i = 0; i < rawGallery["files"]["length"]; i++) {
      files.push(
        new Image(
          this["hitomi"],
          rawGallery["files"][i]["width"],
          rawGallery["files"][i]["height"],
          rawGallery["files"][i]["hash"],
          rawGallery["files"][i]["name"],
          Boolean(rawGallery["files"][i]["hasavif"]),
          true,
          false,
          !i || i === thumbnailIndex,
        ),
      );
    }

    for (i = 0; i < rawGallery["languages"]["length"]; i++) {
      translations.push(
        new TranslatedGallery(
          this["hitomi"],
          rawGallery["languages"][i]["galleryid"],
          new Language(
            this["hitomi"],
            rawGallery["languages"][i]["name"],
            rawGallery["languages"][i]["language_localname"],
          ),
          rawGallery["languages"][i]["url"],
        ),
      );
    }

    const relations: GalleryReference[] = [];

    for (i = 0; i < rawGallery["related"]["length"]; i++) {
      relations.push(
        new GalleryReference(this["hitomi"], rawGallery["related"][i]),
      );
    }

    return new Gallery(
      this["hitomi"],
      +rawGallery["id"],
      rawGallery["language"]
        ? new Language(
            this["hitomi"],
            rawGallery["language"],
            rawGallery["language_localname"] as Language["localName"],
          )
        : null,
      // galleries with rearranged ids have strange urls
      rawGallery["galleryurl"],
      new Title(rawGallery["title"], rawGallery["japanese_title"]),
      rawGallery["type"],
      dedicatedTags[0],
      dedicatedTags[1],
      dedicatedTags[2],
      dedicatedTags[3],
      tags,
      files,
      translations,
      relations,
      Boolean(rawGallery["blocked"]),
      new Date(rawGallery["date"]),
      rawGallery["datepublished"]
        ? new Date(rawGallery["datepublished"])
        : null,
      rawGallery["videofilename"]
        ? new Video(
            this["hitomi"],
            files[1]["width"],
            files[1]["height"],
            rawGallery["videofilename"],
            files[1]["hash"],
          )
        : null,
    );
  }

  // nozomi uses jspack
  // @internal
  private static unpackIds(
    response: Buffer,
    is_negative: boolean = false,
  ): Set<Gallery["id"]> {
    const ids: Set<Gallery["id"]> = new Set<Gallery["id"]>();

    for (let i: number = 0; i + 4 <= response["byteLength"]; i += 4) {
      ids.add(response.readInt32BE(i));
    }

    if (is_negative) {
      // negative flag
      ids.add(0);
    }

    return ids;
  }

  // @internal
  private static createNozomiUrl(
    options: {
      tag?: Tag;
      language?: string;
      orderBy?: SortType;
    } = {},
  ): URL {
    const language: string = options["language"] || "all";
    let orderBy: string = "";

    if (options["orderBy"]) {
      switch (options["orderBy"]) {
        case SortType["DatePublished"]: {
          orderBy = "date/published/";
        }
        case SortType["DateAdded"]:
        // shuffle array later
        case "random": {
          break;
        }

        case SortType["PopularityDay"]:
        case SortType["PopularityWeek"]:
        case SortType["PopularityMonth"]:
        case SortType["PopularityYear"]: {
          orderBy = "popular/" + options["orderBy"] + "/";

          break;
        }

        default: {
          // @ts-expect-error
          throw new HitomiError("OrderBy", formatOneOfState(SortType));
        }
      }
    }

    if (!options["tag"] || options["tag"]["type"] === "language") {
      return [
        RESOURCE_DOMAIN,
        "/n/" + orderBy + "index-" + language + ".nozomi",
      ];
    }

    let area: string;

    switch (options["tag"]["type"]) {
      case "male":
      case "female": {
        area = "tag/";
        orderBy += options["tag"]["type"] + ":";

        break;
      }

      default: {
        area = options["tag"]["type"] + "/";
      }
    }

    return [
      RESOURCE_DOMAIN,
      "/n/" +
        area +
        orderBy +
        encodeURIComponent(options["tag"]["name"]) +
        "-" +
        language +
        ".nozomi",
    ];
  }

  // @internal
  private createReferences(
    ids: Set<number>,
    shouldShuffle: boolean,
  ): GalleryReference[] {
    const references: GalleryReference[] = [];

    for (const id of ids) {
      references.push(new GalleryReference(this["hitomi"], id));
    }

    if (shouldShuffle) {
      let currentIndex: number = references["length"];
      let targetIndex: number;

      while (currentIndex) {
        targetIndex = Math.floor(Math.random() * currentIndex--);

        const temporary: GalleryReference = references[targetIndex];

        references[targetIndex] = references[currentIndex];
        references[currentIndex] = temporary;
      }
    }

    return references;
  }

  /**
   * Lists {@link GalleryReference} entries that match the specified search criteria.
   *
   * When `options.page` is provided, only one non-language tag (optionally combined with a language tag) is allowed, and negative tags are not supported.
   *
   * When using `Popularity{Period}` in `options.orderBy`, the number of galleries may vary.
   *
   * @param {object} [options] Search options.
   * @param {Tag[]} [options.tags] Tag filters as {@link Tag} instances.
   * @param {string} [options.title] Title query string.
   * @param {SortType} [options.orderBy=SortType.DateAdded] Sort order. (defaults to `SortType.DateAdded`)
   * @param {object} [options.page] Pagination options.
   * @param {number} [options.page.index=0] Zero-based page index. (defaults to `0` when `options.page` is provided)
   * @param {number} [options.page.size=25] Number of galleries per page. (defaults to `25` when `options.page` is provided)
   * @returns {Promise<GalleryReference[]>} Promise that resolves to an array of {@link GalleryReference} instances.
   * @throws {HitomiError} Thrown when `page` is used with multiple tags or any negative tag.
   * @see {@link SortType}
   */
  public async list(
    options: {
      tags?: Tag[];
      title?: string;
      orderBy?: SortType;
      page?: {
        index?: number;
        size?: number;
      };
    } = {},
  ): Promise<GalleryReference[]> {
    const id_sets: Set<Gallery["id"]>[] = [];
    const is_random: boolean = options["orderBy"] === "random";
    let language: string | undefined;
    let i: number = 0;
    let range: string | undefined;

    if (options["page"]) {
      const size: number = options["page"]["size"] || 25;
      const start: number = options["page"]["index"]
        ? options["page"]["index"] * size
        : 0;

      range = start * 4 + "-" + ((start + size) * 4 - 1);
    }

    if (options["tags"] && options["tags"]["length"]) {
      // bring positive tags to front
      const tags: Tag[] = options["tags"].slice().sort(function (
        a: Tag,
        b: Tag,
      ): number {
        return (
          (a["is_negative"] as unknown as number) -
          (b["is_negative"] as unknown as number)
        );
      });

      if (tags[0]["is_negative"]) {
        i = -1;
      } else {
        for (; i < tags["length"] && !tags[i]["is_negative"]; i++) {
          if (tags[i]["type"] === "language") {
            language = tags[i]["name"];

            break;
          }
        }

        i = 0;
      }

      if (range) {
        if (tags["length"] > 2 || (tags["length"] === 2 && !language)) {
          throw new HitomiError("Page", "used with multiple tags", false);
        }

        if (tags[tags["length"] - 1]["is_negative"]) {
          throw new HitomiError("Page", "used with negative tag", false);
        }

        return this.createReferences(
          GalleryManager.unpackIds(
            await this["hitomi"].request(
              GalleryManager.createNozomiUrl({
                tag: tags[
                  +(
                    tags[0]["type"] === "language"
                  ) /* selects non-language tag */
                ],
                orderBy: options["orderBy"],
                language: language,
              }),
              range,
            ),
          ),
          is_random,
        );
      }

      id_sets.push(
        GalleryManager.unpackIds(
          await this["hitomi"].request(
            GalleryManager.createNozomiUrl({
              tag: tags[
                i++
              ] /* if first tag is negative i becomes -1, therefore tags give undefined  */,
              orderBy: options["orderBy"],
              language: language,
            }),
          ),
        ),
      );

      for (; i < tags["length"]; i++) {
        if (
          tags[i]["type"] !== "language" ||
          (!language && tags[i]["is_negative"])
        ) {
          id_sets.push(
            GalleryManager.unpackIds(
              await this["hitomi"].request(
                GalleryManager.createNozomiUrl({
                  tag: tags[i],
                  language: language,
                }),
              ),
              tags[i]["is_negative"],
            ),
          );
        }
      }
    } else {
      const urn: URL = GalleryManager.createNozomiUrl({
        orderBy: options["orderBy"],
      });

      if (range) {
        return this.createReferences(
          GalleryManager.unpackIds(await this["hitomi"].request(urn, range)),
          is_random,
        );
      }

      if (options["orderBy"]) {
        id_sets.push(
          GalleryManager.unpackIds(await this["hitomi"].request(urn)),
        );
      }
    }

    if (options["title"] && options["title"]["length"]) {
      const version: string = await this["index"].retrieve();
      const title: string = options["title"].toLowerCase() + " ";
      const rootNode: Node | undefined = await this["index"].getNodeAtAddress(
        0n,
        version,
      );

      if (!rootNode) {
        throw HitomiError["ROOT_NODE_EMPTY"];
      }

      i /* currentIndex */ = 0;
      let j /* nextIndex */ : number = title.indexOf(" ");
      let data: Node[1][number] | undefined;

      while (j !== -1) {
        if (j - i) {
          data = await this["index"].binarySearch(
            hashTerm(title.slice(i, j)),
            rootNode,
            version,
          );

          if (!data) {
            return [];
          }

          id_sets.push(
            GalleryManager.unpackIds(
              await this["hitomi"].request(
                [
                  RESOURCE_DOMAIN,
                  "/galleriesindex/galleries." + version + ".data",
                ],
                data[0] + 4n + "-" + (data[0] + BigInt(data[1]) - 1n),
              ),
            ),
          );
        }

        i = j + 1;
        j = title.indexOf(" ", i);
      }
    }

    let is_negative: boolean;

    if (id_sets["length"]) {
      for (i = 1; i < id_sets["length"]; i++) {
        if (!id_sets[0]["size"]) {
          return [];
        }

        is_negative = id_sets[i].has(0);

        for (const id of id_sets[0]) {
          if (is_negative === id_sets[i].has(id)) {
            id_sets[0].delete(id);
          }
        }
      }
    } else {
      id_sets.push(
        GalleryManager.unpackIds(
          await this["hitomi"].request(GalleryManager.createNozomiUrl()),
        ),
      );
    }

    return this.createReferences(id_sets[0], is_random);
  }
}
