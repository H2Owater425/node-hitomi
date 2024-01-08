import { IS_NEGATIVE } from './constant';

export type ResolveFunction<T = void> = (value: T) => void;

export type RejectFunction = (error?: Error) => void;

export type JsonObject = Record<string, unknown>;

export interface IdSet extends Set<number> {
	[IS_NEGATIVE]: boolean;
}

export interface Node {
	keys: Buffer[];
	datas: [bigint, number][];
	subnodeAddresses: bigint[];
}

export interface Image {
	index: number;
	hash: string;
	name: string;
	hasAvif: boolean;
	hasWebp: boolean;
	hasJxl: boolean;
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
	title: {
		display: string;
		japanese: string | null;
	};
	type: 'doujinshi' | 'manga' | 'artistcg' | 'gamecg' | 'anime';
	languageName: {
		english: string | null;
		local: string | null;
	};
	artists: string[];
	groups: string[];
	series: string[];
	characters: string[];
	tags: Tag[];
	files: Image[];
	publishedDate: Date;
	translations: Pick<Gallery, 'id' | 'languageName'>[];
	relatedIds: number[];
}

export type PopularityPeriod = 'day' | 'week' | 'month' | 'year';

export type StartingCharacter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | '0-9';