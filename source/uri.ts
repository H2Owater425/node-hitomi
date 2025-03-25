import { ERROR_CODE, IMAGE_URI_PARTS } from './constant';
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

	return 'ltn.gold-usergeneratedcontent.net/' + (typeof(options['popularityOrderBy']) !== 'string' ? 'n' : 'popular') + '/' + path + '-' + language + '.nozomi';
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

		return subdomain + 'gold-usergeneratedcontent.net/' + path;
	} else {
		throw new HitomiError(ERROR_CODE['INVALID_VALUE'], 'startsWith', 'not be used only with language');
	}
}

export function getVideoUri(gallery: Gallery): string {
	if(gallery['type'] === 'anime') {
		return 'streaming.gold-usergeneratedcontent.net/videos/' + gallery['title']['display'].toLowerCase().replace(/\s/g, '-') + '.mp4';
	} else {
		throw new HitomiError(ERROR_CODE['INVALID_VALUE'], 'gallery[\'type\']', 'be \'anime\'');
	}
}

export function getGalleryUri(gallery: Gallery): string {
	return ('gold-usergeneratedcontent.net/' + (gallery['type'] !== 'artistcg' ? gallery['type'] : 'cg') + '/' + encodeURIComponent(Buffer.from(gallery['title']['japanese'] || gallery['title']['display']).subarray(0, 200).toString('utf-8')).replace(/\(|\)|'|%(2[0235F]|3[CEF]|5[BD]|7[BD])/g, '-') + (gallery['languageName']['local'] !== null ? '-' + encodeURIComponent(gallery['languageName']['local']) : '') + '-' + gallery['id'] + '.html').toLocaleLowerCase();
}

export class ImageUriResolver {
	public static synchronize(): Promise<void> {
		return fetch('ltn.gold-usergeneratedcontent.net/gg.js')
		.then(function (response: Buffer): void {
			const responseText: string = response.toString('utf-8');
			let currentIndex: number = 0;
			let nextIndex: number = responseText.indexOf('\n');

			IMAGE_URI_PARTS[2].clear();
			
			while(nextIndex !== -1) {
				switch(responseText[currentIndex]) {
					case 'b': {
						IMAGE_URI_PARTS[0] = responseText.slice(currentIndex + 4, nextIndex - 2);

						break;
					}

					case 'o': {
						IMAGE_URI_PARTS[1] = responseText[currentIndex + 4] === '0';

						break;
					}

					case 'c': {
						IMAGE_URI_PARTS[2].add(Number(responseText.slice(currentIndex + 5, nextIndex - 1)));

						break;
					}
				}

				currentIndex = nextIndex + 1;
				nextIndex = responseText.indexOf('\n', currentIndex);
			}

			if(IMAGE_URI_PARTS[0]['length'] !== 0 && IMAGE_URI_PARTS[2]['size'] !== 0 && !IMAGE_URI_PARTS[2].has(NaN)) {
				return;
			} else {
				const subdomainCodeCount: number = IMAGE_URI_PARTS[2]['size'];
				
				IMAGE_URI_PARTS[2].clear();
				
				throw new HitomiError(ERROR_CODE['INVALID_VALUE'], 'ImageUriResolver { [Symbol(pathCode)]: \'' + IMAGE_URI_PARTS[0] + '\', [Symbol(startsWithA)]: ' + IMAGE_URI_PARTS[1] + ', [Symbol(subdomainCodes)]: Set(' + subdomainCodeCount + ') }');
			}
		});
	}

	public static getImageUri(image: Image, extension: 'avif' | 'webp' | 'jxl', options: {
		isThumbnail?: boolean;
		isSmall?: boolean;
	} = {}): string {
		if(IMAGE_URI_PARTS[2]['size'] !== 0) {
			switch(extension) {
				case 'webp':
				case 'avif':
				case 'jxl': {
					if(image['has' + extension[0].toUpperCase() + extension.slice(1) as `has${'Webp' | 'Avif' | 'Jxl'}`]) {
						break;
					}
				}

				default: {
					throw new HitomiError(ERROR_CODE['INVALID_VALUE'], 'extension');
				}
			}

			const imageHashCode: number = Number.parseInt(image['hash'].slice(-1) + image['hash'].slice(-3, -1), 16);
			// let subdomain: string = 'a';
			let subdomain: string = extension[0];
			// Reference make_source_element from https://ltn.hitomi.la/reader.js
			// let path: string = extension;
			let path: string = '';


			if(!options['isThumbnail']) {
				path += IMAGE_URI_PARTS[0] + '/' + imageHashCode + '/' + image['hash'];
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
			return subdomain + (IMAGE_URI_PARTS[2].has(imageHashCode) === IMAGE_URI_PARTS[1] /* ~(IMAGE_URI_PARTS[2].has(imageHashCode) ^ IMAGE_URI_PARTS[1]) */ ? '1' : '2') + '.gold-usergeneratedcontent.net/' + path + '.' + extension;
		} else {
			throw new HitomiError(ERROR_CODE['INVALID_CALL'], 'ImageUriResolver.getImageUri()', 'be called after ImageUriResolver.synchronize()');
		}
	}
}
