import { RESOURCE_DOMAIN } from './constants';
import type { Hitomi } from '../hitomi';
import type { Node } from './types';
import { compare, defineProperties, toString } from './functions';
import { HitomiError } from '../error';

export class Base {
	// @internal
	protected readonly hitomi!: Hitomi;

	// @internal
	constructor(hitomi: Hitomi) {
		defineProperties(this, {
			hitomi: hitomi
		});
	}
}

// @internal
export class Provider<T> extends Base {
	public value!: T;
	private expiresAt: number = 0;
	private promise?: Promise<void>;
	private assign: (value: T) => void;

	constructor(
		hitomi: Hitomi,
		private update: () => Promise<T>,
		private maximumAge: number
	) {
		super(hitomi);

		this.assign = (function (this: Provider<T>, value: T): void {
			this['value'] = value;
			this['expiresAt'] = Date.now() + this['maximumAge'];
			this['promise'] = undefined;
		}).bind(this);
	}

	public async retrieve(): Promise<T> {
		if(Date.now() > this['expiresAt']) {
			if(!this['promise']) {
				this['promise'] = this.update().then(this.assign);
			}

			await this['promise'];
		}

		return this['value'];
	}
}

// @internal
export class IndexProvider extends Provider<string> {
	constructor(
		hitomi: Hitomi,
		private field: 'galleries' | 'languages'
	) {
		super(hitomi, async function (this: IndexProvider): Promise<string> {
			return toString(await this['hitomi'].request([RESOURCE_DOMAIN, '/' + this['field'] + 'index/version']));
		}, hitomi['indexMaximumAge']);
	}

	public async getNodeAtAddress(address: Node[2][number], version: string): Promise<Node | undefined> {
		const response: Uint8Array = await this['hitomi'].request([RESOURCE_DOMAIN, '/' + this['field'] + 'index/' + this['field'] + '.' + version + '.index'], address + '-' + (address + 463n));

		if(!response['length']) {
			return;
		}

		const view: DataView = new DataView(response['buffer']);

		// decode_node
		const node: Node = [[], [], []];
		const keyCount: number = view.getInt32(0);
		let offset: number = 4;
		let i: number;

		for(i = 0; i < keyCount; i++) {
			const keySize: number = view.getInt32(offset);

			if(keySize < 1 || keySize > 31) {
				throw new HitomiError('KeySize', 'between 1 and 31');
			}

			node[0].push(response.subarray(offset += 4, offset += keySize));
		}

		const dataCount: number = view.getInt32(offset);

		offset += 4;

		for(i = 0; i < dataCount; i++) {
			node[1].push([view.getBigUint64(offset), view.getInt32(offset + 8)]);

			offset += 12;
		}

		for(i = 0; i < 17; i++) {
			node[2].push(view.getBigUint64(offset));

			offset += 8;
		}

		return node;
	}

	public async binarySearch(key: Uint8Array, node: Node, version: string): Promise<Node[1][number] | undefined> {
		if(!node[0]['length']) {
			return;
		}

		let compareResult: number = -1;
		let index: number = 0;

		while(
			index < node[0]['length'] &&
			(compareResult = compare(key, node[0][index])) === 1
		) {
			index++;
		}

		if(!compareResult) {
			return node[1][index];
		}

		if(!node[2][index]) {
			return;
		}

		let isLeaf: boolean = true;

		for(let i: number = 0; i < node[2]['length']; i++) {
			if(node[2][i]) {
				isLeaf = false;

				break;
			}
		}

		if(isLeaf) {
			return;
		}

		const nextNode: Node | undefined = await this.getNodeAtAddress(node[2][index], version);

		if(!nextNode) {
			return;
		}

		return this.binarySearch(key, nextNode, version);
	}
}