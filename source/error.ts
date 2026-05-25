import { GALLERY_TYPES, TAG_TYPES } from './internal/constants';

export class HitomiError extends Error {
	// @internal
	public static OneOfState<T>(name: string, iteratable: Iterable<T>): HitomiError {
		return new HitomiError(name, 'one of ' + (iteratable[Symbol['iterator']] ? Array.from(iteratable) : Object.values(iteratable)).join(', '));
	}

	public static get OneOfGalleryType(): HitomiError {
		throw HitomiError.OneOfState('Name', GALLERY_TYPES);
	}

	// @internal
	public static get OneOfTagType(): HitomiError {
		return HitomiError.OneOfState('Type', TAG_TYPES);
	}
	// @internal
	public static get RootNodeEmpty(): HitomiError {
		return new HitomiError('Root node', 'empty', false);
	}
	// @internal
	public static get ImageContextResolverFail(): HitomiError {
		return new HitomiError('ImageContextResolver must succeed');
	}

	// @internal
	constructor(messageOrTarget: string, state?: string, isAffirmative: boolean = true) {
		if (arguments['length'] === 1) {
			super(messageOrTarget);

			return;
		}

		super(messageOrTarget + ' must ' + (isAffirmative ? '' : 'not ') + 'be ' + state);
	}
}
