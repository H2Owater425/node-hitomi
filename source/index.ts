import { Hitomi } from './hitomi';

export { Gallery, Title, TranslatedGallery, GalleryReference, GalleryManager, type GalleryOptions, type PageOptions } from './gallery';
export { Hitomi, type HitomiOptions } from './hitomi';
export { Image, Video } from './media';
export { Language, Tag, TagManager } from './tag';
export { HitomiError } from './error';
export { SortType, NameInitial, Extension, ThumbnailSize } from './enums';
export { ResponseType, type RequestContext } from '@platform';

export const hitomi: Hitomi = new Hitomi();
export default hitomi;