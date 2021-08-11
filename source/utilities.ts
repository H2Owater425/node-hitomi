import { IncomingMessage } from 'http';
import { request, Agent, AgentOptions } from 'https';
import { connect, TLSSocket } from 'tls';
import { LooseObject } from './types';

export function isInteger(value: any): boolean {
	if(Number.parseInt(value) === Number(value) && Number.isFinite(value) && typeof(value) !== 'object') {
		return true;
	} else {
		return false;
	}
}

class _Agent extends Agent {
	public createConnection(options: AgentOptions, callback?: () => void): TLSSocket {
		options['servername'] = undefined;
		return connect(options, callback);
	}
}

const agent: _Agent = new _Agent({ rejectUnauthorized: false, keepAlive: true });

export function fetchBuffer(url: string, header?: LooseObject): Promise<Buffer> {
	return new Promise<Buffer>(function (resolve: (value: Buffer | PromiseLike<Buffer>) => void, reject: (reason?: any) => void): void {
		const _url: URL = new URL(url);
		
		request({
			hostname: _url['hostname'],
			path: _url['pathname'],
			method: 'GET',
			port: 443,
			headers: {
				'Accept': '*/*',
				'Connection': 'keep-alive',
				...header
			},
			agent: agent
		}, function (response: IncomingMessage): void {
			let bufferList: Buffer[] = [];
			let bufferLength: number = 0;

			response.on('data', function (chunk: any): void {
				bufferList.push(chunk);
				bufferLength += chunk.byteLength;

				return;
			});

			response.on('error', function (error: Error): void {
				reject(error);

				return;
			});

			response.on('end', function (): void {
				resolve(Buffer.concat(bufferList, bufferLength));

				return;
			});

			return;
		}).end();

		return;
	});
}

export function getArrayBuffer(buffer: Buffer): ArrayBuffer {
	let arrayBuffer: ArrayBuffer = new ArrayBuffer(buffer.byteLength);
	let unit8Array: Uint8Array = new Uint8Array(arrayBuffer);

	for (let i: number = 0; i < buffer.byteLength; ++i) {
		unit8Array[i] = buffer[i];
	}

	return arrayBuffer;
}