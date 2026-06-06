import { Tag } from '@/structures/tag';

export const PARTIAL_TAG_TYPES: typeof Tag['TYPES'] = new Set(Tag['TYPES']);

PARTIAL_TAG_TYPES.delete('language');
PARTIAL_TAG_TYPES.delete('type');