import { Hitomi } from './hitomi';

export type { Gallery, Title, TranslatedGallery, GalleryReference, GalleryManager } from './gallery';
export { Hitomi } from './hitomi';
export type { Image, Video } from './media';
export type { Language, Tag, TagManager } from './tag';
export { HitomiError } from './error';
export { SortType, NameInitial, Extension, ThumbnailSize } from './enums';

export const hitomi: Hitomi = new Hitomi();
export default hitomi;