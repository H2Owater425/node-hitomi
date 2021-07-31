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
	japaneseTitle: string | null;
	type: 'doujinshi' | 'manga' | 'artistcg' | 'gamecg' | 'anime';
	languageName: string | null;
	localLanguageName: string | null;
	artistList: string[];
	groupList: string[];
	seriesList: string[];
	characterList: string[];
	tagList: Tag[];
	fileList: Image[];
	publishedDate: Date;
}

export type OrderCriteria = 'index' | 'popularity';

export interface LooseObject {
	[key: string]: any;
}