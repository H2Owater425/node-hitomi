import typescript from '@rollup/plugin-typescript';
import { resolve as pathResolve } from 'path';
import { dts } from 'rollup-plugin-dts';
import { rmSync } from 'fs';
import type { Plugin, RollupOptions } from "rollup";
import type { SourceFile, TransformationContext, Node, PropertyAssignment, Expression } from 'typescript';
import { isEnumDeclaration, visitEachChild, NodeFlags, visitNode } from 'typescript';

function replace(type: 'cjs' | 'esm' | 'browser' | 'types'): Plugin {
	const isTypes: boolean = type === 'types';

	return {
		name: 'replace',
		renderChunk: function (code: string): string {
			while(/(?<=^\t*) {4}/gm.test(code)) {
				code = code.replace(/(?<=^\t*) {4}/gm, '	');
			}

			if(!isTypes) {
				code = code.replace(/\[\s*["']([a-zA-Z_$][a-zA-Z0-9_$]*)["']\s*\]/g, '.$1')
				.replace(/(?<=(while|if|switch|for)) /gm, '')
				.replace(/\n+\t+(?=else)/gm, ' ')
				.replace(/^import '\.\/platform\/browser\.js';\n/gm, '')
				.replace(/^require\('\.\/platform\/node\.cjs'\);\n/gm, '')
				.replace(/^import '\.\/platform\/node\.mjs';\n/gm, '');
			} else {
				if(code.includes('@link Hitomi') && !code.includes('class Hitomi') && !code.includes('\'./hitomi.js\'')) {
					code = code.replace(/^$/m, 'import { Hitomi } from \'../hitomi.js\';\n');
				}

				if(code.includes('@link Gallery') && !code.includes('class Gallery') && !code.includes('\'./gallery.js\'')) {
					code = code.replace(/^$/m, 'import { Gallery } from \'./gallery.js\';\n');
				}

				code = code.replace(/^declare const enum /gm, 'declare enum ');
			}

			return code.replace(/{\n}/gm, '{}')
				.replace(/"([^'"]+)"/gm, '\'$1\'');
		}
	};
}

function resolve(type: 'cjs' | 'esm' | 'browser'): Plugin {
	const path: string = pathResolve(import.meta['dirname'], 'source/platform/' + (type === 'browser' ? 'browser' : 'node') + '.ts');

	return {
		name: 'resolve',
		resolveId: function (source: string): string | undefined {
			if(source === '@platform') {
				return path;
			}
		}
	};
}

function configuration(type: 'cjs' | 'esm' | 'browser'): RollupOptions {
	const isCjs: boolean = type === 'cjs';

	return {
		input: 'source/index.ts',
		output: {
			dir: 'distribution/' + type,
			format: isCjs ? 'cjs' : 'esm',
			exports: isCjs ? 'named' : 'auto',
      preserveModules: true,
      preserveModulesRoot: 'source',
			entryFileNames: '[name].' + (isCjs ? 'c' : type === 'esm' ? 'm' : '') + 'js',
			generatedCode: {
				constBindings: true
			}
		},
		external: ['util', 'https', 'zlib', 'crypto'],
		plugins: [
			resolve(type),
			typescript({
				tsconfig: './tsconfig.json',
				transformers: {
					before: [{
						type: 'program',
						factory: function (): (context: TransformationContext) => (sourceFile: SourceFile) => SourceFile {
							return function (context: TransformationContext): (sourceFile: SourceFile) => SourceFile {
								return function (sourceFile: SourceFile): SourceFile {
									return visitNode(sourceFile, function visitor(node: Node): Node {
										if(isEnumDeclaration(node)) {
											const propertyAssignments: PropertyAssignment[] = [];

											for(let i: number = 0; i < node['members']['length']; i++) {
												propertyAssignments.push(context['factory'].createPropertyAssignment(
													node['members'][i]['name'],
													node['members'][i]['initializer'] as Expression 
												));
											}

											return context['factory'].createVariableStatement(
												node['modifiers'],
												context['factory'].createVariableDeclarationList([
													context['factory'].createVariableDeclaration(
														node['name'],
														undefined,
														undefined,
														context['factory'].createObjectLiteralExpression(
															propertyAssignments,
															true
														)
													)
												], NodeFlags['Const'])
											);
										}

										return visitEachChild(node, visitor, context);
									}) as SourceFile;
								};
							};
						}
					}]
				}
			}),
			replace(type)
		]
	} satisfies RollupOptions;
}

rmSync('distribution', {
	recursive: true,
	force: true
});

export default [
	configuration('cjs'),
	configuration('esm'),
	configuration('browser'),
	{
		input: 'source/index.ts',
		output: {
			dir: 'distribution/types',
      preserveModules: true,
      preserveModulesRoot: 'source',
		},
		external: ['util', 'https', 'zlib', 'crypto'],
		plugins: [
			resolve('esm'),
			dts({
				compilerOptions: {
					removeComments: false
				}
			}),
			replace('types')
		]
	}
] satisfies RollupOptions[];