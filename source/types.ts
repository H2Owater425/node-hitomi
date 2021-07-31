export interface Image {
	index: number;
	hash: string;
	extension: 'jpg' | 'png';
	hasAvif: boolean;
	hasWebp: boolean;
	width: number;
	height: number;
}

export type TagType = 'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag';

export interface Tag {
	type: TagType;
	name: string;
	isNegative?: boolean;
}

export interface Gallery {
	id: number;
	title: {
		display: string;
		japanese: string | null;
	};
	type: 'doujinshi' | 'manga' | 'artistcg' | 'gamecg' | 'anime';
	languageName: {
		english: string | null;
		local: string | null;
	};
	artistList: string[];
	groupList: string[];
	seriesList: string[];
	characterList: string[];
	tagList: Tag[];
	fileList: Image[];
	publishedDate: Date;
}

export type OrderCriteria = 'index' | 'popularity';

export type StartingCharacter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | '123';

export interface LooseObject {
	[key: string]: any;
}