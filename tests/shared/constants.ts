import { TextEncoder } from 'util';
import type { Tag } from '../../source/tag';
import { TAG_TYPES } from '../../source/internal/constants';

export const PARTIAL_TAG_TYPES: Set<Tag['type']> = new Set(TAG_TYPES);

PARTIAL_TAG_TYPES.delete('language');
PARTIAL_TAG_TYPES.delete('type');

export const encoder: TextEncoder = new TextEncoder();