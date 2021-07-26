import { Gallery, Image, OrderCriteria, Tag } from "./types";
import { isInteger } from "./utilities";

export function getImageUrl(imageData: Image, extension: 'jpg' | 'png' | 'avif' | 'webp', option?: { isThumbnail?: boolean; }): string {
	const isThumbnail: boolean = typeof(option) !== 'undefined' && typeof(option['isThumbnail']) !== 'undefined' ? option['isThumbnail'] : false;

	switch(extension) {
		case 'jpg':
			if(!isThumbnail && imageData['extension'] !== 'jpg') {
				throw Error('Invalid extension');
			} else {
				break;
			}
		case 'png':
			if(imageData['extension'] !== 'png') {
				throw Error('Invalid extension');
			} else if(isThumbnail) {
				throw Error('Invalid extension for thumbnail');
			} else {
				break;
			}
		case 'avif':
			if(!imageData['hasAvif']) {
				throw Error('Invalid extension');
			} else {
				break;
			}
		case 'webp':
			if(!imageData['hasWebp']) {
				throw Error('Invalid extension');
			} else if(isThumbnail) {
				throw Error('Invalid extension for thumbnail');
			} else {
				break;
			}
	}

	if(!/^[0-9a-f]{64}$/.test(imageData['hash'])) {
		throw Error('Invalid hash value');
	} else if(!isInteger(imageData['index']) || imageData['index'] < 0) {
		throw Error('Invalid image index');
	} else if(isThumbnail && imageData['index'] !== 0) {
		throw Error('Invalid index for thumbnail');
	} else {
		const imagePath: string = `${imageData['hash'].slice(-1)}/${imageData['hash'].slice(-3, -1)}/${imageData['hash']}`;
		let subdomain: string;
		let folderName: string;
	
		if(!isThumbnail) {
			let frontendCount: number = 3;
			let hexadecimalId: number = Number.parseInt(imageData['hash'].slice(-3, -1), 16);
	
			if(hexadecimalId < 48) {
				frontendCount = 2
			}
	
			if(hexadecimalId < 9) {
				hexadecimalId = 1
			}
	
			subdomain = `${String.fromCharCode(hexadecimalId % frontendCount + 97)}`;
	
			if(extension === 'jpg' || extension === 'png') {
				subdomain += 'b';
				folderName = 'images';
			} else {
				subdomain += 'a';
				folderName = `${extension}`;
			}
		} else {
			subdomain = 'tn';
	
			if(extension === 'jpg' || extension === 'png') {
				folderName = 'bigtn';
			} else {
				folderName = 'avifbigtn';
			}
		}
	
		return `https://${subdomain}.hitomi.la/${folderName}/${imagePath}.${extension}`;
	}
}

export function getGalleryUrl(galleryData: Gallery): string {
	const title: string = encodeURIComponent(galleryData['titleJapanese'] !== null ? galleryData['titleJapanese'] : galleryData['title']).replace(/\(|\)|'|%(2(0|2|3|5|F)|3(C|E|F)|5(B|D)|7(B|D))/g, '-');
	const language: string = galleryData['languageLocalName'] !== null ? `-${encodeURIComponent(galleryData['languageLocalName'])}` : '';

	return `https://hitomi.la/${galleryData['type']}/${title}${language}-${galleryData['id']}.html`.toLocaleLowerCase();
}

export function getNozomiUrl(tag: Tag, option?: { orderCriteria?: OrderCriteria }): string {
	if(tag['type'] !== 'language' && typeof(option) !== 'undefined' && typeof(option['orderCriteria'])) {
		throw Error(`Invalid order criteria for ${tag['type']} tag type`);
	} else {
		const orderCriteria: OrderCriteria = typeof(option) !== 'undefined' && typeof(option['orderCriteria']) !== 'undefined' ? option['orderCriteria'] : 'index';

		let area: string = '';
		let tagString: string = '';
		let language: string = 'all';

		switch(tag['type']) {
			case 'male':
			case 'female':
				area = 'tag/';
				tagString = `${tag['type']}:${tag['name'].replace(/_/g, ' ')}`;

				break;
			case 'language':
				tagString = orderCriteria;
				language = tag['name'];

				break;
			default:
				area = `${tag['type']}/`;
				tagString = tag['name'].replace(/_/g, ' ');

				break;
		}

		return `https://ltn.hitomi.la/n/${area}${tagString}-${language}.nozomi`;
	}
}