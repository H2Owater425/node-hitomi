import { TAG_TYPES } from '../internal/constants';

/**
 * Error codes for identifying {@link HitomiError}.
 *
 * @readonly
 * @enum {string}
 * @see {@link HitomiError.code}
 */
export enum ErrorCode {
	InvalidArgument = 'INVALID_ARGUMENT',
	UnsupportedMediaVariant = 'UNSUPPORTED_MEDIA_VARIANT',
	UnexpectedHttpStatus = 'UNEXPECTED_HTTP_STATUS',
	UnexpectedResourceFormat = 'UNEXPECTED_RESOURCE_FORMAT',
	InvalidTagName = 'INVALID_TAG_NAME'
}

/**
 * An error thrown by node-hitomi.
 *
 * @extends {Error}
 */
export class HitomiError extends Error {
	// @internal
	public static InvalidMember<T>(name: string, iteratable: Iterable<T>): HitomiError {
		return new HitomiError(ErrorCode['InvalidArgument'], name, 'one of ' + (iteratable[Symbol['iterator']] ? Array.from(iteratable) : Object.values(iteratable)).join(', '));
	}

	// @internal
	public static UnexpectedHttpStatus(host: string, path: string, code: number): HitomiError {
		return new HitomiError(ErrorCode['UnexpectedHttpStatus'], 'https://' + host + path + ' must not respond with ' + code);
	}

	// @internal
	public static get InvalidTagName(): HitomiError {
		return new HitomiError(ErrorCode['InvalidTagName'], 'Name', 'valid');
	}

	// @internal
	public static get InvalidTagType(): HitomiError {
		return HitomiError.InvalidMember('Type', TAG_TYPES);
	}

	// @internal
	public static get EmptyRootNode(): HitomiError {
		return new HitomiError(ErrorCode['UnexpectedResourceFormat'], 'Root node', 'empty', false);
	}

	// @internal
	public static get UnparsableImageContext(): HitomiError {
		return new HitomiError(ErrorCode['UnexpectedResourceFormat'], 'Image context', 'parsable');
	}

	public readonly code: ErrorCode;

	// @internal
	constructor(code: ErrorCode, messageOrTarget: string, state?: string, isAffirmative: boolean = true) {
		super(messageOrTarget + (arguments['length'] === 2 ? '' : ' must ' + (isAffirmative ? '' : 'not ') + 'be ' + state));

		this['name'] = 'HitomiError [' + code + ']';
		this['code'] = code;
	}
}