import { TAG_TYPES } from '../../source/internal/constants';

export const PARTIAL_TAG_TYPES: typeof TAG_TYPES = new Set(TAG_TYPES);

PARTIAL_TAG_TYPES.delete('language');
PARTIAL_TAG_TYPES.delete('type');