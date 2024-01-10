import { getGallery, getGalleryIds } from './gallery';
import { getParsedTags, getTags } from './tag';
import { getNozomiUri, getTagUri, getVideoUri, getGalleryUri, ImageUriResolver } from './uri';

export default {
	getGallery,
	getGalleryIds,
	getParsedTags,
	getTags,
	getNozomiUri,
	getTagUri,
	getVideoUri,
	getGalleryUri,
	ImageUriResolver,
	default: {
		getGallery,
		getGalleryIds,
		getParsedTags,
		getTags,
		getNozomiUri,
		getTagUri,
		getVideoUri,
		getGalleryUri,
		ImageUriResolver
	}
}