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

export function getGallery(id: number): Promise<Gallery>;

export function getGalleryIds(options?: {
	title?: string;
	tags?: Tag[];
	range?: {
		start?: number;
		end?: number;
	};
	popularityOrderBy?: PopularityPeriod;
}): Promise<number[]>;

export function getParsedTags(text: string): Tag[];

export function getTags(type: Tag['type'], startsWith?: StartingCharacter): Promise<Tag[]>;

export function getNozomiUri(options?: {
	tag?: Tag;
	popularityOrderBy?: PopularityPeriod;
}): string;

export function getTagUri(type: Tag['type'], startsWith?: StartingCharacter): string;

export function getVideoUri(gallery: Gallery): string;

export function getGalleryUri(gallery: Gallery): string;

export class ImageUriResolver {
	public static synchronize(): Promise<void>;

	public static getImageUri(image: Image, extension: 'avif' | 'webp' | 'jxl', options?: {
		isThumbnail?: boolean;
		isSmall?: boolean;
	}): string;
}

declare module hitomi {
	interface Image {
		index: number;
		hash: string;
		name: string;
		hasAvif: boolean;
		hasWebp: boolean;
		hasJxl: boolean;
		width: number;
		height: number;
	}
	
	interface Tag {
		type: 'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag';
		name: string;
		isNegative?: boolean;
	}
	
	interface Gallery {
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
	
	type PopularityPeriod = 'day' | 'week' | 'month' | 'year';
	
	type StartingCharacter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | '0-9';

	function getGallery(id: number): Promise<Gallery>;
	
	function getGalleryIds(options?: {
		title?: string;
		tags?: Tag[];
		range?: {
			start?: number;
			end?: number;
		};
		popularityOrderBy?: PopularityPeriod;
	}): Promise<number[]>;

	function getParsedTags(text: string): Tag[];
	
	function getTags(type: Tag['type'], startsWith?: StartingCharacter): Promise<Tag[]>;

	function getNozomiUri(options?: {
		tag?: Tag;
		popularityOrderBy?: PopularityPeriod;
	}): string;

	function getTagUri(type: Tag['type'], startsWith?: StartingCharacter): string;

	function getVideoUri(gallery: Gallery): string;

	function getGalleryUri(gallery: Gallery): string;

	class ImageUriResolver {
		public static synchronize(): Promise<void>;

		public static getImageUri(image: Image, extension: 'avif' | 'webp' | 'jxl', options?: {
			isThumbnail?: boolean;
			isSmall?: boolean;
		}): string;
	}
}

export default hitomi;