import { TAG_TYPES } from '../../source/utilities/constants';

export const PARTIAL_TAG_TYPES: typeof TAG_TYPES = TAG_TYPES;

PARTIAL_TAG_TYPES.delete('language');
PARTIAL_TAG_TYPES.delete('type');