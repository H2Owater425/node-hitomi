import { TAG_TYPES } from './utilities/constants';
import { formatOneOfState } from './utilities/functions';


export class HitomiError extends Error {
	// @internal
	public static get TAG_TYPE(): HitomiError {
		return new HitomiError('Type', formatOneOfState(TAG_TYPES));
	}
	// @internal
	public static get ROOT_NODE_EMPTY(): HitomiError {
		return new HitomiError('Root node', 'empty', false);
	}
	// @internal
	public static get IMAGE_CONTEXT_RESOLVER(): HitomiError {
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
