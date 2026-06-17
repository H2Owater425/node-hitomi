import { ErrorCode, HitomiError } from '@/index';
import assert from 'assert';

export function createMock<T>(value: Partial<T>): T {
	return value as T;
}

export function createError(code: ErrorCode, message: RegExp): HitomiError {
	return {
		name: 'HitomiError [' + code + ']',
		code: code,
		// @ts-expect-error - Not a real message
		message: message
	};
}

export function assertInstanceOf<T extends new (...args: any) => unknown>(actual: unknown, expected: T): asserts actual is InstanceType<T> {
	assert.ok(actual instanceof expected);
}