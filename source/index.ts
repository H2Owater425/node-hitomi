import { Hitomi } from './hitomi';

export { Gallery, Title, TranslatedGallery as TranslatedGallery, GalleryReference } from './gallery';
export { Hitomi } from './hitomi';
export { Image } from './media';
export { Language, Tag } from './tag';
export { HitomiError } from './utilities/structures';
export { SortType, NameInitial, Extension, ThumbnailSize } from './utilities/constants';

export const hitomi: Hitomi = new Hitomi();
export default hitomi;