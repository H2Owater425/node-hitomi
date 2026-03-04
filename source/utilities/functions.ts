import { createHash } from 'crypto';

// @internal
export function hashTerm(term: string): Buffer {
	return createHash('sha256').update(term).digest().subarray(0, 4);
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
export function formatOneOfState<T>(object: Iterable<T>): string {
	return 'one of ' + (object[Symbol['iterator']] ? Array.from(object) : Object.values(object)).join(', ');
}

// @internal
export function capitalize<T extends string>(word: T): Capitalize<T> {
	return String.fromCharCode(word.charCodeAt(0) - 32) + word.slice(1) as Capitalize<T>;
}