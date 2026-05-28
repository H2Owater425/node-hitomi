import { Hitomi } from './hitomi';

export { type HitomiOptions, Hitomi } from './hitomi';
export { type GalleryOptions, type PageOptions, SortType, GalleryManager } from './managers/gallery';
export { NameInitial, TagManager } from './managers/tag';
export { HitomiError } from './structures/error';
export { Title, GalleryReference, TranslatedGallery, Gallery } from './structures/gallery';
export { Extension, ThumbnailSize, Image, Video } from './structures/media';
export { Language, Tag } from './structures/tag';
export { type RequestContext, type RequestFunction, type HashFunction, type OnRequestFunction, ResponseType } from '@platform';

/**
 * A default {@link Hitomi} client.
 */
export const hitomi: Hitomi = new Hitomi();
export default hitomi;