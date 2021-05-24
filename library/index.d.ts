export as namespace hitomi;

interface PageRange {
	startIndex: number;
	endIndex?: number;
}

export interface Image {
    index: number;
    hash: string;
    extension: 'jpg' | 'png';
    hasAvif: boolean;
    hasWebp: boolean;
    width: number;
    height: number;
}

export interface Tag {
    type: 'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag';
    name: string;
    isNegative?: boolean;
}

export interface Gallery {
    id: number;
    title: string;
    titleJapanese: string | null;
    type: 'doujinshi' | 'manga' | 'artistcg' | 'gamecg';
    language: string | null;
    languageLocalName: string | null;
    artists: string[];
    groups: string[];
    series: string[];
    characters: string[];
    tags: Tag[];
    files: Image[] | null;
    publishedDate: Date;
}

export declare function getImageUrl(imageData: Image, extension: 'jpg' | 'png' | 'avif' | 'webp', option?: { isThumbnail: boolean; }): string;
export declare function getGalleryUrl(galleryData: Gallery): string;
export declare function getNozomiUrl(tag: Tag): string;
export declare function getGalleryData(id: number, option?: { includeFiles: boolean; }): Promise<Gallery>;
export declare function getGalleryIdList(range: PageRange, option?: { reverse: boolean; }): Promise<number[]>;
export declare function parseTag(tagString: string): Tag[];
export declare function queryTag(tagList: Tag[]): Promise<number[]>;