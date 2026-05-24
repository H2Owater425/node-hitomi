import { Hitomi } from './hitomi';

export { Gallery, Title, TranslatedGallery, GalleryReference, GalleryManager, SortType, type GalleryOptions, type PageOptions } from './gallery';
export { Hitomi, type HitomiOptions } from './hitomi';
export { Image, Video, Extension, ThumbnailSize } from './media';
export { Language, Tag, TagManager, NameInitial } from './tag';
export { HitomiError } from './error';
export { ResponseType, type RequestContext } from '@platform';

export const hitomi: Hitomi = new Hitomi();
export default hitomi;