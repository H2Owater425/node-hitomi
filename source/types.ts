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
	files: Image[];
	publishedDate: Date;
}

export type OrderCriteria = 'index' | 'popularity';

export interface LooseObject {
	[key: string]: any;
}