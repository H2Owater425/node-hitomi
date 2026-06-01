import type { Tag } from '../structures/tag';

// @internal
// compare_arraybuffers in search.js
export function compareBuffers(a: Uint8Array, b: Uint8Array): number {
	const length: number = a['byteLength'] < b['byteLength'] ? a['byteLength'] : b['byteLength'];

	for(let i: number = 0; i < length; i++) {
		if(a[i] < b[i]) {
			return -1;
		}

		if(a[i] > b[i]) {
			return 1;
		}
	}

	return 0;
}

// @internal
export function compareTags(a: Tag, b: Tag): number {
	return (a['isNegative'] as unknown as number) - (b['isNegative'] as unknown as number);
}

// @internal
export function defineProperties<T>(target: T, properties: Record<string, unknown>) {
	for(const key in properties) {
		properties[key] = {
			value: properties[key]
		};
	}

	Object.defineProperties(target, properties as PropertyDescriptorMap);
}

// @internal
export function capitalize<T extends string>(word: T): Capitalize<T> {
	return String.fromCharCode(word.charCodeAt(0) & 223) + word.slice(1) as Capitalize<T>;
}