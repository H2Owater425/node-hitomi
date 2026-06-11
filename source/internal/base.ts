import type { Hitomi } from '../hitomi';

export function defineProperties<T>(target: T, properties: Record<string, unknown>): void {
	for(const key in properties) {
		properties[key] = {
			value: properties[key]
		};
	}

	Object.defineProperties<T>(target, properties as PropertyDescriptorMap);
}

export class Base {
	// @internal
	protected readonly hitomi!: Hitomi;

	// @internal
	protected defineProperties(properties: Record<string, unknown>): void {
		defineProperties(this, properties);
	}

	// @internal
	constructor(hitomi: Hitomi) {
		this.defineProperties({
			hitomi: hitomi
		});
	}
}