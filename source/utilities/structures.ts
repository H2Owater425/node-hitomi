import { RESOURCE_DOMAIN } from './constants';
import type { Hitomi } from '../hitomi';
import type { Node } from './types';
import { defineProperty } from './functions';

export class HitomiError extends Error {
	// @internal
	public static readonly TAG_TYPE: HitomiError = new HitomiError('type', 'one of artist, group, type, language, series, character, male, female, tag');
	// @internal
	public static readonly ROOT_NODE_EMPTY: HitomiError = new HitomiError('Root node', 'empty', false);

	// @internal
	constructor(messageOrTarget: string, state?: string, isAffirmative: boolean = true) {
		if(arguments['length'] === 1) {
			super(messageOrTarget);

			return;
		}

		super(messageOrTarget + ' must ' + (isAffirmative ? '' : 'not ') + 'be ' + state);
	}
}

export class Base {
	// @internal
	protected readonly hitomi!: Hitomi;

	// @internal
	constructor(hitomi: Hitomi) {
		defineProperty(this, 'hitomi', hitomi);
	}
}

// @internal
export class Provider<T> extends Base {
	public value!: T;
	private updatedAt: number = 0;
	private promise?: Promise<void>;
	private update: () => Promise<T>;
	private assign: (value: T) => void;

	constructor(hitomi: Hitomi, update: Provider<T>['update'], private age: number) {
		super(hitomi);

		this.update = update.bind(this);
		this.assign = (function (this: Provider<T>, value: T): void {
			this['value'] = value;
			this['updatedAt'] = Date.now();
			this['promise'] = undefined;
		}).bind(this);
	}

	public async retrieve(): Promise<T> {
		if(Date.now() - this['updatedAt'] > this['age']) {
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
			return String(await this['hitomi'].request([RESOURCE_DOMAIN, '/' + this['field'] + 'index/version']));
		}, 600000);
	}

	public async getNodeAtAddress(address: Node[2][number], version: string): Promise<Node | undefined> {
		const response: Buffer = await this['hitomi'].request([RESOURCE_DOMAIN, '/' + this['field'] + 'index/' + this['field'] + '.' + version + '.index'], address + '-' + (address + 463n));

		if(!response['length']) {
			return;
		}

		// decode_node
		const node: Node = [[], [], []];
		const keyCount: number = response.readInt32BE(0);
		let offset: number = 4;
		let i: number;
	
		for(i = 0; i < keyCount; i++) {
			const keySize: number = response.readInt32BE(offset);

			if(keySize < 1 || keySize > 31) {
				throw new HitomiError('KeySize', 'between 1 and 31');
			}

			node[0].push(response.subarray(offset += 4, offset += keySize));
		}
	
		const dataCount: number = response.readInt32BE(offset);
		
		offset += 4;
	
		for(i = 0; i < dataCount; i++) {
			node[1].push([response.readBigUInt64BE(offset), response.readInt32BE(offset + 8)]);
			
			offset += 12;
		}
	
		for(i = 0; i < 17; i++) {
			node[2].push(response.readBigUInt64BE(offset));

			offset += 8;
		}
	
		return node;
	}

	public async binarySearch(key: Buffer, node: Node, version: string): Promise<Node[1][number] | undefined> {
		if(!node[0]['length']) {
			return;
		}

		let compareResult: number = -1;
		let index: number = 0;
		
		while(index < node[0]['length'] && (compareResult = key.compare(node[0][index])) === 1) {
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