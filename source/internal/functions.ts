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