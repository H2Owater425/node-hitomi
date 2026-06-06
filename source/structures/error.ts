/**
 * Codes for identifying an error.
 *
 * @enum {string}
 * @readonly
 * @see {@link HitomiError}
 */
export enum ErrorCode {
	InvalidArgument = 'INVALID_ARGUMENT',
	InvalidCombination = 'INVALID_COMBINATION',
	InvalidField = 'INVALID_FIELD',
	UnexpectedResponseStatus = 'UNEXPECTED_RESPONSE_STATUS',
	UnexpectedResponseBody = 'UNEXPECTED_RESPONSE_BODY'
}

/**
 * An error thrown by node-hitomi.
 *
 * @extends {Error}
 */
export class HitomiError extends Error {
	// @internal
	public static invalidMember<T>(name: string, iteratable: Iterable<T>): HitomiError {
		return new HitomiError(ErrorCode['InvalidArgument'], name, 'one of ' + (iteratable[Symbol['iterator']] ? Array.from<T>(iteratable) : Object.values(iteratable)).join(', '));
	}

	// @internal
	public static unexpectedResponseStatus(host: string, path: string, code: number): HitomiError {
		return new HitomiError(ErrorCode['UnexpectedResponseStatus'], 'https://' + host + path + ' must not respond with ' + code);
	}

	// @internal
	public static get invalidTagName(): HitomiError {
		return new HitomiError(ErrorCode['InvalidField'], 'Name', 'valid');
	}

	// @internal
	public static get emptyRootNode(): HitomiError {
		return new HitomiError(ErrorCode['UnexpectedResponseBody'], 'Root node', 'empty', false);
	}

	// @internal
	public static get unparsableImageContext(): HitomiError {
		return new HitomiError(ErrorCode['UnexpectedResponseBody'], 'Image context', 'parsable');
	}

	/**
	 * The code for identifying an error.
	 *
	 * @type {ErrorCode}
	 * @readonly
	 * @see {@link ErrorCode}
	 */
	public readonly code: ErrorCode;

	// @internal
	constructor(code: ErrorCode, messageOrTarget: string, state?: string, isAffirmative: boolean = true) {
		super(messageOrTarget + (arguments['length'] === 2 ? '' : ' must ' + (isAffirmative ? '' : 'not ') + 'be ' + state));

		this['name'] = 'HitomiError [' + code + ']';
		this['code'] = code;
	}
}