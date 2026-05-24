import { Hitomi } from './hitomi';

export * from './managers';
export { Gallery, Title, TranslatedGallery, GalleryReference } from './gallery';
export { Hitomi, type HitomiOptions } from './hitomi';
export { Image, Video, Extension, ThumbnailSize } from './media';
export { Language, Tag } from './tag';
export { HitomiError } from './error';
export { ResponseType, type RequestContext } from '@platform';

export const hitomi: Hitomi = new Hitomi();
export default hitomi;