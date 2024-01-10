import { ERROR_CODE, PATH_CODE, STARTS_WITH_A, SUBDOMAIN_CODES } from './constant';
import { Gallery, Image, PopularityPeriod, StartingCharacter, Tag } from './type';
import { HitomiError, fetch } from './utility';

export function getNozomiUri(options: {
	tag?: Tag;
	popularityOrderBy?: PopularityPeriod;
} = {}): string {
	let path: string = 'index';
	let language: string = 'all';
	
	if(typeof(options['tag']) === 'object') {
		switch(options['tag']['type']) {
			case 'male':
			case 'female': {
				path = 'tag/' + options['tag']['type'] + ':' + encodeURIComponent(options['tag']['name']);

				break;
			}

			case 'language': {
				language = options['tag']['name'];

				break;
			}

			default: {
				path = options['tag']['type'] + '/' + encodeURIComponent(options['tag']['name']);

				break;
			}
		}
	} else if(typeof(options['popularityOrderBy']) === 'string') {
		path = options['popularityOrderBy'] !== 'day' ? options['popularityOrderBy'] : 'today';
	}

	return 'ltn.hitomi.la/' + (typeof(options['popularityOrderBy']) !== 'string' ? 'n' : 'popular') + '/' + path + '-' + language + '.nozomi';
}

export function getTagUri(type: Tag['type'], startsWith?: StartingCharacter): string {
	const isLanguage: boolean = type === 'language';

	if(typeof(startsWith) === 'string' !== isLanguage) {
		let subdomain: string = 'ltn.';
		let path: string = 'all';

		if(isLanguage) {
			path = 'language_support';
		} else {
			subdomain = '';

			switch(type) {
				case 'tag':
				case 'male':
				case 'female': {
					path += 'tags';

					break;
				}

				case 'artist':
				case 'series':
				case 'character':
				case 'group': {
					path += type;

					if(!type.endsWith('s')) {
						path += 's';
					}

					break;
				}

				default: {
					throw new HitomiError(ERROR_CODE['INVALID_VALUE'], 'type');
				}
			}

			path += '-' + (startsWith !== '0-9' ? startsWith : '123') + '.html';
		}

		return subdomain + 'hitomi.la/' + path;
	} else {
		throw new HitomiError(ERROR_CODE['INVALID_VALUE'], 'startsWith', 'not be used only with language');
	}
}

export function getVideoUri(gallery: Gallery): string {
	if(gallery['type'] === 'anime') {
		return 'streaming.hitomi.la/videos/' + gallery['title']['display'].toLowerCase().replace(/\s/g, '-') + '.mp4';
	} else {
		throw new HitomiError(ERROR_CODE['INVALID_VALUE'], 'gallery[\'type\']', 'be \'anime\'');
	}
}

export function getGalleryUri(gallery: Gallery): string {
	return ('hitomi.la/' + (gallery['type'] !== 'artistcg' ? gallery['type'] : 'cg') + '/' + encodeURIComponent(Buffer.from(gallery['title']['japanese'] || gallery['title']['display']).subarray(0, 200).toString('utf-8')).replace(/\(|\)|'|%(2[0235F]|3[CEF]|5[BD]|7[BD])/g, '-') + (gallery['languageName']['local'] !== null ? '-' + encodeURIComponent(gallery['languageName']['local']) : '') + '-' + gallery['id'] + '.html').toLocaleLowerCase();
}

export class ImageUriResolver {
	private static [PATH_CODE]: string;
	private static [STARTS_WITH_A]: boolean;
	private static [SUBDOMAIN_CODES]: Set<number> = new Set<number>();

	public static synchronize(): Promise<void> {
		return fetch('ltn.hitomi.la/gg.js')
		.then(function (response: Buffer): void {
			const responseText: string = response.toString('utf-8');
			let currentIndex: number = 0;
			let nextIndex: number = responseText.indexOf('\n');

			ImageUriResolver[SUBDOMAIN_CODES].clear();
			
			while(nextIndex !== -1) {
				switch(responseText[currentIndex]) {
					case 'b': {
						ImageUriResolver[PATH_CODE] = responseText.slice(currentIndex + 4, nextIndex - 2);

						break;
					}

					case 'o': {
						ImageUriResolver[STARTS_WITH_A] = responseText[currentIndex + 4] === '0';

						break;
					}

					case 'c': {
						ImageUriResolver[SUBDOMAIN_CODES].add(Number(responseText.slice(currentIndex + 5, nextIndex - 1)));

						break;
					}
				}

				currentIndex = nextIndex + 1;
				nextIndex = responseText.indexOf('\n', currentIndex);
			}

			if(typeof(ImageUriResolver[PATH_CODE]) === 'string' && typeof(ImageUriResolver[STARTS_WITH_A]) === 'boolean' && ImageUriResolver[SUBDOMAIN_CODES]['size'] !== 0 && !ImageUriResolver[SUBDOMAIN_CODES].has(NaN)) {
				return;
			} else {
				const subdomainCodeCount: number = ImageUriResolver[SUBDOMAIN_CODES]['size'];
				
				ImageUriResolver[SUBDOMAIN_CODES].clear();
				
				throw new HitomiError(ERROR_CODE['INVALID_VALUE'], 'ImageUriResolver { [Symbol(pathCode)]: \'' + ImageUriResolver[PATH_CODE] + '\', [Symbol(startsWithA)]: ' + ImageUriResolver[STARTS_WITH_A] + ', [Symbol(subdomainCodes)]: Set(' + subdomainCodeCount + ') }');
			}
		});
	}

	public static getImageUri(image: Image, extension: 'avif' | 'webp' | 'jxl', options: {
		isThumbnail?: boolean;
		isSmall?: boolean;
	} = {}): string {
		if(ImageUriResolver[SUBDOMAIN_CODES]['size'] !== 0) {
			switch(extension) {
				case 'webp': {
					if(image['hasWebp']) {
						break;
					}
				}

				case 'avif': {
					if(image['hasAvif']) {
						break;
					}
				}
				
				case 'jxl': {
					if(image['hasJxl']) {
						break;
					}
				}

				default: {
					throw new HitomiError(ERROR_CODE['INVALID_VALUE'], 'extension');
				}
			}

			const imageHashCode: number = Number.parseInt(image['hash'].slice(-1) + image['hash'].slice(-3, -1), 16);
			let subdomain: string = 'a';
			// Reference make_source_element from https://ltn.hitomi.la/reader.js
			let path: string = extension;

			if(!options['isThumbnail']) {
				path += '/' + ImageUriResolver[PATH_CODE] + '/' + imageHashCode + '/' + image['hash'];
			} else {
				if(options['isSmall']) {
					if(extension === 'avif') {
						path += 'small';
					} else {
						throw new HitomiError(ERROR_CODE['INVALID_VALUE'], 'options[\'isSmall\']', 'be used with avif');
					}
				}

				path +=  'bigtn/' + image['hash'].slice(-1) + '/' + image['hash'].slice(-3, -1)  + '/' + image['hash'];
				subdomain = 'tn';
			}

			// Reference subdomain_from_url from https://ltn.hitomi.la/common.js
			return (ImageUriResolver[SUBDOMAIN_CODES].has(imageHashCode) === ImageUriResolver[STARTS_WITH_A] /* ~(ImageUriResolver[SUBDOMAIN_CODES].has(imageHashCode) ^ this['startsWithA']) */ ? 'a' : 'b') + subdomain + '.hitomi.la/' + path + '.' + extension;
		} else {
			throw new HitomiError(ERROR_CODE['INVALID_CALL'], 'ImageUriResolver.getImageUri()', 'be called after ImageUriResolver.synchronize()');
		}
	}
}