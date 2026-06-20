import typescript from '@rollup/plugin-typescript';
import { resolveFilename } from './resolver';
import { dts } from 'rollup-plugin-dts';
import { rmSync } from 'fs';
import type { Plugin, RollupOptions } from "rollup";
import type { SourceFile, TransformationContext, Node, PropertyAssignment, CustomTransformers } from 'typescript';
import { isEnumDeclaration, visitEachChild, NodeFlags, visitNode, isSourceFile } from 'typescript';

const CLASS_PATHS: Record<string, string> = {
	'Hitomi': '../hitomi',
	'Gallery': './gallery',
	'GalleryManager': '../managers/gallery',
	'TagManager': '../managers/tag',
};

function replace(type: 'cjs' | 'esm' | 'browser' | 'types'): Plugin {
	const isTypes: boolean = type === 'types';

	return {
		name: 'replace',
		renderChunk: function (code: string): string {
			while(/(?<=^\t*) {4}/gm.test(code)) {
				code = code.replace(/(?<=^\t*) {4}/gm, '	');
			}

			code = code.replace(/"([^'"]+)"/g, '\'$1\'');

			if(!isTypes) {
				code = code.replace(/(?<=[^\s\t])\[\s*'([a-zA-Z_$][a-zA-Z0-9_$]*)'\s*\]/g, '.$1')
					.replace(/(?<=(while|if|switch|for)) /g, '')
					.replace(/\n+\t+(?=else)/g, ' ');
			} else {
				for(const _class in CLASS_PATHS) {
					if(code.includes('{@link ' + _class + '}') && !code.includes('class ' + _class) && !(new RegExp('({ |, )' + _class + '( }|, )', 'g')).test(code)) {
						code = code.replace('\n\n', '\nimport { ' + _class + ' } from \'' + CLASS_PATHS[_class] + '.js\';\n\n');
					}
				}

				code = code.replace(/^declare const enum /g, 'declare enum ')
					.replace(/{(\n|\s)+}/g, '{}');
			}

			return code;
		}
	};
}

function resolve(type: 'cjs' | 'esm' | 'browser'): Plugin {
	return {
		name: 'resolve',
		resolveId: function (source: string): string | void {
			return resolveFilename(source, type);
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
		treeshake: {
			moduleSideEffects: false
		},
		external: ['util', 'https', 'zlib', 'crypto'],
		plugins: [
			resolve(type),
			typescript({
				tsconfig: './tsconfig.json',
				transformers: function (): CustomTransformers {
					return {
						before: [function (context: TransformationContext): (sourceFile: SourceFile) => SourceFile {
							return function (sourceFile: SourceFile): SourceFile {
								return visitNode(sourceFile, function visitor(node: Node): Node {
									if(isEnumDeclaration(node)) {
										const propertyAssignments: PropertyAssignment[] = [];
										let lasstInitializer: number = -1;

										for(let i: number = 0; i < node['members']['length']; i++) {
											if(node['members'][i]['initializer']) {
												// @ts-expect-error
												lasstInitializer = +node['members'][i]['initializer'].getText();
											}

											propertyAssignments.push(context['factory'].createPropertyAssignment(
												node['members'][i]['name'],
												node['members'][i]['initializer'] || context['factory'].createNumericLiteral(++lasstInitializer)
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
								}, isSourceFile);
							};
						}]
					};
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
			preserveModulesRoot: 'source'
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