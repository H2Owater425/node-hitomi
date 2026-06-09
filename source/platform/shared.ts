/**
 * Expected response body formats.
 *
 * @enum {number}
 */
export const enum ResponseType {
	BYTE = 0,
	VIEW = 1,
	TEXT = 2,
	JSON = 3
}

/**
 * A context describing an outgoing HTTP request.
 *
 * @template T The platform-specific request options type (`RequestInit` in browsers, `https.RequestOptions` otherwise).
 */
export interface RequestContext<T = unknown> {
	/**
	 * The target hostname.
	 *
	 * @type {string}
	 */
	host: string;

	/**
	 * The target path.
	 *
	 * @type {string}
	 */
	path: string;

	/**
	 * The expected response type.
	 *
	 * @type {ResponseType}
	 */
	type: ResponseType;

	/**
	 * Platform-specific request options.
	 *
	 * @type {T}
	 */
	options: T;
}

/**
 * A custom transport function for making HTTPS requests.
 *
 * The response body must be decompressed before returning if the server sends a compressed response.
 *
 * @template T The platform-specific request options type.
 * @param {RequestContext<T>} context The final request context after `onRequest` is invoked.
 * @returns {Uint8Array | Promise<Uint8Array>} The response body as a `Uint8Array`, or a `Promise` that resolves to one.
 * @see {@link RequestContext}
 */
export type TransportFunction<T = unknown> = (context: RequestContext<T>) => Uint8Array | Promise<Uint8Array>;

/**
 * A custom function for computing a SHA-256 hash.
 *
 * @param {string} text The input string to hash.
 * @returns {Uint8Array | Promise<Uint8Array>} The hash digest as a `Uint8Array`, or a `Promise` that resolves to one.
 */
export type ComputeHashFunction = (text: string) => Uint8Array | Promise<Uint8Array>;

/**
 * A hook function invoked before each HTTP request.
 *
 * @template T The platform-specific request options type.
 * @param {RequestContext<T>} context The request context to inspect or modify.
 * @returns {RequestContext<T> | void | Promise<RequestContext<T> | void>} A modified context to use for the request, or `void` to use the original.
 * @see {@link RequestContext}
 */
export type OnRequestFunction<T = unknown> = (context: RequestContext<T>) => RequestContext<T> | void | Promise<RequestContext<T> | void>;