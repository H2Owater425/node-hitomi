import { IncomingMessage, OutgoingHttpHeaders } from 'http';
import { request } from 'https';
import { IdSet, Node, RejectFunction, ResolveFunction } from './type';
import { ERROR_CODE } from './constant';

export class HitomiError extends Error {
	constructor(code: ERROR_CODE, ...values: string[]) {
		switch(code) {
			case ERROR_CODE['INVALID_VALUE']: {
				super(values[0] + ' must ' + (values['length'] === 1 ? 'be valid' : values[1]));
				this['name'] = 'INVALID_VALUE';

				break;
			}
	
			case ERROR_CODE['INVALID_CALL']: {
				super(values[0] + ' must ' + values[1]);
				this['name'] = 'INVALID_CALL';

				break;
			}

			case ERROR_CODE['DUPLICATED_ELEMENT']: {
				super(values[0] + ' must not be duplicated');
				this['name'] = 'DUPLICATED_ELEMENT';

				break;
			}
	
			case ERROR_CODE['LACK_OF_ELEMENT']: {
				super(values[0] + ' must have more elements');
				this['name'] = 'LACK_OF_ELEMENT';

				break;
			}
	
			case ERROR_CODE['REQEUST_REJECTED']: {
				super('Request to \'' + values[0].replace(/'/g, '\\\'') + '\' was rejected');
				this['name'] = 'REQEUST_REJECTED';

				break;
			}

			default: {
				throw null;
			}
		}

		this['name'] = 'HitomiError [' + this['name'] + ']';
	}
}

export function fetch(uri: string, headers: OutgoingHttpHeaders = {}): Promise<Buffer> {
	return new Promise<Buffer>(function (resolve: ResolveFunction<Buffer>, reject: RejectFunction): void {
		const pathIndex: number = uri.indexOf('/');

		request({
			hostname: uri.slice(0, pathIndex),
			path: uri.slice(pathIndex),
			method: 'GET',
			port: '443',
			headers: Object.assign(headers, {
				accept: '*/*',
				connection: 'keep-alive',
				referer: 'https://gold-usergeneratedcontent.net'
			})
		}, function (response: IncomingMessage): void {
			const chunks: Buffer[] = [];
			let totalLength: number = 0;

			switch(response['statusCode']) {
				case 200:
				case 206: {
					response.on('data', function (chunk: Buffer): void {
						chunks.push(chunk);
						totalLength += chunk['byteLength'];

						return;
					})
					.once('error', reject)
					.once('end', function (): void {
						resolve(Buffer.concat(chunks, totalLength));

						return;
					});

					break;
				}

				default: {
					reject(new HitomiError(ERROR_CODE['REQEUST_REJECTED'], 'https://' + uri));

					break;
				}
			}

			return;
		})
		.once('error', reject)
		.end();

		return;
	});
}

export function getIdSet(buffer: Buffer, isNegative: boolean = false): IdSet {
  const integers: IdSet = new Set<number>() as IdSet;

	integers['isNegative'] = isNegative;

  for (let i: number = 0; i < buffer['byteLength']; i += 4) {
    integers.add(buffer.readInt32BE(i));
  }

  return integers;
}

function getNode(data: Buffer): Node {
	const node: Node = [[], [], []];
	const keyCount: number = data.readInt32BE(0);
	let index: number = 4;

	for(let i: number = 0; i < keyCount; i++) {
		const keySize: number = data.readInt32BE(index);

		if(keySize > 0 && keySize < 32) {
			index += 4;

			node[0].push(data.subarray(index, index + keySize));

			index += keySize;
		} else {
			throw new HitomiError(ERROR_CODE['INVALID_VALUE'], 'keySize', 'between 1 and 31');
		}
	}

	const dataCount: number = data.readInt32BE(index);
	
	index += 4;

	for(let i: number = 0; i < dataCount; i++) {
		node[1].push([data.readBigUInt64BE(index), data.readInt32BE(index + 8)]);
		
		index += 12;
	}

	for (let i: number = 0; i < 17; i++) {
		node[2].push(data.readBigUInt64BE(index));
		index += 8;
	}

	return node;
}

export function getNodeAtAddress(address: bigint, version: string): Promise<Node | undefined> {
	return fetch('ltn.gold-usergeneratedcontent.net/galleriesindex/galleries.' + version + '.index', {
		range: 'bytes=' + address + '-' + (address + 463n)
	})
	.then(function (response: Buffer): Node | undefined {
		if(response['length'] !== 0) {
			return getNode(response);
		} else {
			return;
		}
	});
}

export function binarySearch(key: Buffer, node: Node, version: string): Promise<Node[1][number] | undefined> {
	if(node[0]['length'] !== 0) {
		let compareResult: number = -1;
		let index: number = 0;
		
		while(index < node[0]['length']) {
			compareResult = key.compare(node[0][index]);

			if(compareResult <= 0) {
				break;
			} else {
				index++;
			}
		}

		if(compareResult === 0) {
			return Promise.resolve(node[1][index]);
		} else if(node[2][index] === 0n) {
			return Promise.resolve() as Promise<undefined>;
		} {
			let isLeaf: boolean = true;

			for(let i: number = 0; i < node[2]['length']; i++) {
				if(node[2][i] !== 0n) {
					isLeaf = false;

					break;
				}
			}

			if(isLeaf) {
				return Promise.resolve() as Promise<undefined>;
			}
		}

		return getNodeAtAddress(node[2][index], version)
		.then(function (node: Node | void): Promise<Node[1][number] | undefined> | undefined {
			if(typeof(node) === 'object') {
				return binarySearch(key, node, version);
			} else {
				return;
			}
		});
	} else {
		return Promise.resolve() as Promise<undefined>;
	}
}