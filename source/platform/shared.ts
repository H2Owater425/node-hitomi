export const enum ResponseType {
	BYTE = 0,
	VIEW = 1,
	TEXT = 2,
	JSON = 3
}

export type RequestFunction = (host: string, path: string, headers: Record<string, string>) => Uint8Array | Promise<Uint8Array>;

export type HashFunction = (text: string) => Uint8Array | Promise<Uint8Array>;

export type OnRequestFunction<T = unknown> = (context: RequestContext<T>) => RequestContext<T> | void | Promise<RequestContext<T> | void>;

export interface RequestContext<T = unknown> {
	host: string;
	path: string;
	type: ResponseType;
	options: T;
}