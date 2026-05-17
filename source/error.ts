import { TAG_TYPES } from './internal/constants';
import { formatOneOfState } from './internal/functions';

export class HitomiError extends Error {
	// @internal
	public static get OneOfTagType(): HitomiError {
		return new HitomiError('Type', formatOneOfState(TAG_TYPES));
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
