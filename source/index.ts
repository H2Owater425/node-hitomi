import { getGallery, getGalleryIds } from './gallery';
import { getParsedTags, getTags } from './tag';
import { getNozomiUri, getTagUri, getVideoUri, getGalleryUri } from './uri';

export default {
	getGallery,
	getGalleryIds,
	getParsedTags,
	getTags,
	getNozomiUri,
	getTagUri,
	getVideoUri,
	getGalleryUri,
	default: {
		getGallery,
		getGalleryIds,
		getParsedTags,
		getTags,
		getNozomiUri,
		getTagUri,
		getVideoUri,
		getGalleryUri
	}
}