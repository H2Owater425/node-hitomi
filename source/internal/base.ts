import type { Hitomi } from '../hitomi';
import { defineProperties } from './functions';

export class Base {
	// @internal
	protected readonly hitomi!: Hitomi;

	// @internal
	constructor(hitomi: Hitomi) {
		defineProperties(this, {
			hitomi: hitomi
		});
	}
}
