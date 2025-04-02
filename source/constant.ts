import { Tag } from './type';

export const enum ERROR_CODE {
	INVALID_VALUE,
	INVALID_CALL,
	DUPLICATED_ELEMENT,
	LACK_OF_ELEMENT,
	REQEUST_REJECTED
}

export const RAW_GALLERY_KEYS = ['parody', 'artist', 'group', 'character'] as const;

export const TAG_TYPES: ReadonlySet<Tag['type']> = new Set<Tag['type']>((RAW_GALLERY_KEYS.slice(1) as Tag['type'][]).concat('type', 'language', 'series', 'male', 'female', 'tag'));

// Preparation for future class-based update
export const IMAGE_URI_PARTS: [string, boolean, Set<number>] = [''/* pathCode */, false/* startsWithA */, new Set<number>()/* subdomainCodes */];

export const BASE_DOMAIN: string = 'gold-usergeneratedcontent.net';

export const RESOURCE_DOMAIN: string = 'ltn.' + BASE_DOMAIN;