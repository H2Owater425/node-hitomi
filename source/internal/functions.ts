import { createHash } from 'crypto';

// @internal
// compare_arraybuffers
export function compare(a: Uint8Array, b: Uint8Array): 0 | 1 | -1 {
	const length: number = a['byteLength'] > b['byteLength'] ? a['byteLength'] : b['byteLength'];

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
export function hashTerm(term: string): Uint8Array {
	return createHash('sha256').update(term).digest().subarray(0, 4);
}

const decoder: TextDecoder = new TextDecoder();

export function toString(buffer: Uint8Array): string {
	return decoder.decode(buffer);
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
	return String.fromCharCode(word.charCodeAt(0) - 32) + word.slice(1) as Capitalize<T>;
}