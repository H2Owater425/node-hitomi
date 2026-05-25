import { Agent, request as httpsRequest, RequestOptions } from 'https';
import { IncomingMessage, OutgoingHttpHeaders } from 'http';
import { createGunzip } from 'zlib';
import { createHash } from 'crypto';
import type { Readable } from 'stream';
import { DEFAULT_HEADERS } from '../internal/constants';
import { RequestContext, ResponseType } from './shared';
import { Hitomi } from '../hitomi';
import { HitomiError } from '@/structures/error';

const agent: Agent = new Agent({
	keepAlive: true
});

// @internal
export function request(host: string, path: string, type: ResponseType.BYTE, range?: string): Promise<Uint8Array>;
export function request(host: string, path: string, type: ResponseType.VIEW, range?: string): Promise<DataView>;
export function request(host: string, path: string, type: ResponseType.TEXT, range?: string): Promise<string>;
export function request(host: string, path: string, type: ResponseType.JSON, range?: string): Promise<unknown>;
export async function request(this: Hitomi, host: string, path: string, type: ResponseType, range?: string): Promise<unknown> {
	let context: RequestContext<RequestOptions> = {
		host: host,
		path: path,
		type: type,
		options: {
			agent: agent,
			headers: Object.assign<OutgoingHttpHeaders, OutgoingHttpHeaders>(range ? {
				range: 'bytes=' + range
			} : {
				'accept-encoding': 'gzip'
			}, DEFAULT_HEADERS)
		}
	};

	context = (await this.onRequest(context) as RequestContext<RequestOptions>) || context;

	context['options']['host'] = context['host'];
	context['options']['path'] = context['path'];

	return new Promise<unknown>(function (resolve: (value: unknown) => void, reject: (error?: unknown) => void): void {
		httpsRequest(context['options'], function (response: IncomingMessage): void {
			switch(response['statusCode']) {
				case 200:
				case 206: {
					response.on('error', reject);

					break;
				}

				default: {
					response.resume();

					return reject(new HitomiError('https://' + host + path + ' must not respond with ' + response['statusCode']));
				}
			}

			const chunks: Buffer[] = [];
			let length: number = 0;

			if(response['headers']['content-encoding']) {
				response = response.pipe(createGunzip())
					.on('error', reject) as Readable as IncomingMessage;
			}

			response.on('data', function (chunk: Buffer): void {
				chunks.push(chunk);
				length += chunk['byteLength'];
			})
			.on('end', function (): void {
				const buffer: Buffer = Buffer.concat(chunks, length);

				switch(type) {
					case ResponseType['BYTE']: {
						// Buffer inherits Uint8Array
						return resolve(buffer);
					}

					case ResponseType['VIEW']: {
						return resolve(new DataView(buffer['buffer'], buffer['byteOffset'], length));
					}

					case ResponseType['TEXT']: {
						return resolve(buffer.toString());
					}

					case ResponseType['JSON']: {
						return resolve(JSON.parse(buffer.toString()));
					}
				}
			});
		})
		.on('error', reject)
		.end();
	});
}

// To match return value with browser hash function implementation
// @internal
export function hash(text: string): Promise<Uint8Array> {
	return Promise.resolve(createHash('sha256').update(text).digest().subarray(0, 4));
}

// @internal
export function toString(buffer: Uint8Array): string {
	return Buffer.from(buffer['buffer'], buffer['byteOffset'], buffer['byteLength']).toString();
}

export * from './shared';