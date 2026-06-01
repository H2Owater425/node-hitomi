import { HitomiError } from '../structures/error';
import type { Hitomi } from '../hitomi';
import { DEFAULT_HEADERS } from '../internal/constants';
import { type RequestContext, ResponseType } from './shared';

// @internal
export function request(host: string, path: string, type: ResponseType.BYTE, range?: string): Promise<Uint8Array>;
export function request(host: string, path: string, type: ResponseType.VIEW, range?: string): Promise<DataView>;
export function request(host: string, path: string, type: ResponseType.TEXT, range?: string): Promise<string>;
export function request(host: string, path: string, type: ResponseType.JSON, range?: string): Promise<unknown>;
export async function request(this: Hitomi, host: string, path: string, type: ResponseType, range?: string): Promise<unknown> {
	let context: RequestContext<RequestInit> = {
		host: host,
		path: path,
		type: type,
		options: {
			headers: Object.assign<HeadersInit, HeadersInit>(range ? {
				range: 'bytes=' + range
			} : {}, DEFAULT_HEADERS),
			referrerPolicy: 'same-origin'
		}
	};

	context = (await this.onRequest(context) as RequestContext<RequestInit>) || context;

	const response: Response = await fetch('https://' + context['host'] + context['path'], context['options']);

	switch(response['status']) {
		case 200:
		case 206: {
			switch(type) {
				case ResponseType['BYTE']: {
					return new Uint8Array(await response.arrayBuffer());
				}

				case ResponseType['VIEW']: {
					return new DataView(await response.arrayBuffer());
				}

				case ResponseType['TEXT']: {
					return response.text();
				}

				case ResponseType['JSON']: {
					return response.json();
				}
			}
		}

		default: {
			throw HitomiError.UnexpectedHttpStatus(host, path, response['status']);
		}
	}
}

const encoder: TextEncoder = new TextEncoder();

// @internal
export async function hash(text: string): Promise<Uint8Array> {
	return new Uint8Array(await crypto['subtle'].digest('sha256', encoder.encode(text)), 0, 4);
}

const decoder: TextDecoder = new TextDecoder();

// @internal
export function toString(buffer: Uint8Array): string {
	return decoder.decode(buffer);
}

export * from './shared';