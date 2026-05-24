import type { Gallery } from '../gallery';
import type { Language, Tag } from '../tag';

export const BASE_DOMAIN = 'gold-usergeneratedcontent.net' as const;

// @ts-expect-error - Typescript internal error
export const RESOURCE_DOMAIN: `ltn.${typeof BASE_DOMAIN}` = 'ltn.' + BASE_DOMAIN;

export const FRONT_DOMAIN = 'hitomi.la' as const;

// @ts-expect-error - Typescript internal error
export const TAG_INDEX_DOMAIN: `tagindex.${typeof FRONT_DOMAIN}` = 'tagindex.' + FRONT_DOMAIN;

export const DEFAULT_HEADERS = {
	referer: 'https://' + FRONT_DOMAIN
} as const;

export const MAXIMUM_AGE_PROPERTIES = ['indexMaximumAge', 'imageContextMaximumAge'] as const;

export const DEDICATED_TAG_PROPERTIES = ['artist', 'group', 'parody', 'character'] as const;

export const BINARY_ORDERED_LANGUAGES = [
  ['indonesian', 'Bahasa Indonesia'],
  ['javanese', 'Basa Jawa'],
  ['catalan', 'Català'],
  ['cebuano', 'Cebuano'],
  ['czech', 'Čeština'],
  ['danish', 'Dansk'],
  ['german', 'Deutsch'],
  ['estonian', 'Eesti'],
  ['english', 'English'],
  ['spanish', 'Español'],
  ['esperanto', 'Esperanto'],
  ['french', 'Français'],
  ['hindi', 'Hindi'],
  ['icelandic', 'Íslenska'],
  ['italian', 'Italiano'],
  ['latin', 'Latina'],
  ['hungarian', 'Magyar'],
  ['dutch', 'Nederlands'],
  ['norwegian', 'Norsk'],
  ['polish', 'Polski'],
  ['portuguese', 'Português'],
  ['romanian', 'Română'],
  ['albanian', 'Shqip'],
  ['slovak', 'Slovenčina'],
  ['serbian', 'Srpski'],
  ['finnish', 'Suomi'],
  ['swedish', 'Svenska'],
  ['tagalog', 'Tagalog'],
  ['vietnamese', 'Tiếng Việt'],
  ['turkish', 'Türkçe'],
  ['greek', 'Ελληνικά'],
  ['bulgarian', 'Български'],
  ['mongolian', 'Монгол'],
  ['russian', 'Русский'],
  ['ukrainian', 'Українська'],
  ['hebrew', 'עברית'],
  ['arabic', 'العربية'],
  ['persian', 'فارسی'],
  ['thai', 'ไทย'],
  ['burmese', 'မြန်မာဘာသာ'],
  ['korean', '한국어'],
  ['chinese', '中文'],
  ['japanese', '日本語']
] as const;

export const LANGUAGE_NAMES: Set<Language['name']> = new Set<Language['name']>();

for(let i: number = 0; i < BINARY_ORDERED_LANGUAGES['length']; i++) {
	LANGUAGE_NAMES.add(BINARY_ORDERED_LANGUAGES[i][0]);
}

export const GALLERY_TYPES: Set<Gallery['type']> = new Set<Gallery['type']>([
	'doujinshi',
	'manga',
	'artistcg',
	'gamecg',
	'imageset',
	'anime'
]);

export const TAG_TYPES: Set<Tag['type']> = new Set<Tag['type']>([
	'artist',
	'group',
	'type',
	'language',
	'series',
	'character',
	'male',
	'female',
	'tag'
]);