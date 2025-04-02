import { getGallery, getGalleryIds } from './gallery';
import { getParsedTags, getTags } from './tag';
import { getNozomiUri, getTagUri, getVideoUri, getGalleryUri, ImageUriResolver } from './uri';

const hitomi = {
	getGallery: getGallery,
	getGalleryIds: getGalleryIds,
	getParsedTags: getParsedTags,
	getTags: getTags,
	getNozomiUri: getNozomiUri,
	getTagUri: getTagUri,
	getVideoUri: getVideoUri,
	getGalleryUri: getGalleryUri,
	ImageUriResolver: ImageUriResolver,
} as const;

export default Object.assign(hitomi, {
	default: hitomi
});