import assert from 'node:assert/strict';

export function createMock<T>(value: Partial<Record<keyof T, unknown>> & Record<string, unknown>): T {
	return value as T;
}

export function assertInstanceOf<T extends new (...args: any) => unknown>(actual: unknown, expected: T): asserts actual is InstanceType<T> {
	assert.ok(actual instanceof expected);
}