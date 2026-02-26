import { createHash } from 'crypto';

// @internal
export function hashTerm(term: string): Buffer {
	return createHash('sha256').update(term).digest().subarray(0, 4);
}

// @internal
export function parseNumber(value: string, isHex: boolean = false): number {
	return Number.parseInt(value, isHex ? 16 : 10);
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
export function formatOneOfState(object: object): string {
	return 'one of ' + Object.values(object).join(', ');
}