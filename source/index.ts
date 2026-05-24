import { Hitomi } from './hitomi';

export * from './managers';
export * from './structures'
export { Hitomi, type HitomiOptions } from './hitomi';
export { ResponseType, type RequestContext } from '@platform';

export const hitomi: Hitomi = new Hitomi();
export default hitomi;