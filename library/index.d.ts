export as namespace hitomi;

export interface Tag {
	type: 'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag';
	name: string;
	isNegative?: boolean;
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

export declare function getGalleryData(id: number, option?: { includeFullData?: boolean; includeFiles?: boolean; }): Promise<Gallery>;
export declare function getGalleryIdList(range: { startIndex: number; endIndex?: number; }, option?: { reverse?: boolean; }): Promise<number[]>;
export declare function parseTag(tagString: string): Tag[];
export declare function queryTag(tagList: Tag[]): Promise<number[]>;
export declare function getImageUrl(imageData: Image, extension: 'jpg' | 'png' | 'avif' | 'webp', option?: { isThumbnail?: boolean; }): string;
export declare function getGalleryUrl(galleryData: Gallery): string;
export declare function getNozomiUrl(tag: Tag): string;