export const BASE_DOMAIN = 'gold-usergeneratedcontent.net' as const;

// @ts-expect-error - Typescript internal error
export const RESOURCE_DOMAIN: `ltn.${typeof BASE_DOMAIN}` = 'ltn.' + BASE_DOMAIN;

export const FRONT_DOMAIN = 'hitomi.la' as const;

// @ts-expect-error - Typescript internal error
export const TAG_INDEX_DOMAIN: `tagindex.${typeof FRONT_DOMAIN}` = 'tagindex.' + FRONT_DOMAIN;

export const DEFAULT_HEADERS = {
	referer: 'https://' + FRONT_DOMAIN
} as const;