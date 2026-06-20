import Module from 'module';
import { resolve as pathResolve } from 'path';

const sourcePath: string = pathResolve(import.meta['dirname'], 'source');
const platformPath: string = pathResolve(sourcePath, 'platform');

export function resolveFilename(request: string, type: 'cjs' | 'esm' | 'browser' = 'esm'): string | void {
	if(request === '@platform') {
		return pathResolve(platformPath, (type === 'browser' ? 'browser' : 'node') + '.ts');
	}

	if(request.startsWith('@/')) {
		return pathResolve(sourcePath, request.slice(2));
	}
}

// @ts-expect-error
const _resolveFilename: Function = Module._resolveFilename;
const builtinModuleSet: Set<string> = new Set<string>(Module['builtinModules']);

// @ts-expect-error
Module._resolveFilename = function (request: string): unknown {
	if(!builtinModuleSet.has(request)) {
		arguments[0] = resolveFilename(request) || request;
	}

	return _resolveFilename.apply(this, arguments);
};