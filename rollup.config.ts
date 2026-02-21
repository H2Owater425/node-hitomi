import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { dts } from 'rollup-plugin-dts';
import { rmSync } from 'fs';
import type { Plugin, RollupOptions } from "rollup";
import type { SourceFile, TransformationContext, Node, PropertyAssignment, Expression } from 'typescript';
import { isEnumDeclaration, visitEachChild, NodeFlags, visitNode } from 'typescript';

function rmdir(type: 'cjs' | 'esm' | 'types'): Plugin {
	return {
		name: 'rmdir',
		load: function (): void {
			rmSync('distribution/' + type, {
				recursive: true,
				force: true
			});
		}
	};
}

function indent(): Plugin {
	return {
		name: 'indent',
		renderChunk: function (code: string): string {
			while(/(?<=^\t*) {4}/gm.test(code)) {
				code = code.replace(/(?<=^\t*) {4}/gm, '	');
			}

			return code.replace(/{\n}/gm, '{}');
		}
	};
}

function configuration(type: 'cjs' | 'esm'): RollupOptions {
	const isEsm: boolean = type === 'esm';

	return {
		input: 'source/index.ts',
		output: {
			dir: 'distribution/' + type,
			format: type,
			exports: isEsm ? 'auto' : 'named',
      preserveModules: true,
      preserveModulesRoot: 'source',
			entryFileNames: '[name].' + (isEsm ? 'm' : 'c') + 'js',
			generatedCode: {
				constBindings: true
			}
		},
		plugins: [
			rmdir(type),
			resolve(),
			commonjs(),
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
														context['factory'].createCallExpression(
															context['factory'].createPropertyAccessExpression(
																context['factory'].createIdentifier('Object'),
																'freeze'
															),
															undefined,
															[
																context['factory'].createObjectLiteralExpression(
																	propertyAssignments,
																	true
																)
															]
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
			indent(),
			{
				name: 'compact',
				renderChunk: function (code: string): string {
					return code.replace(/(?<=(while|if|switch|for)) /gm, '')
						.replace(/\n+\t+(?=else)/gm, ' ')
						.replace(/\[\s*["']([a-zA-Z_$][a-zA-Z0-9_$]*)["']\s*\]/g, '.$1');
				}
			}
		]
	} satisfies RollupOptions;
}

export default [
	configuration('cjs'),
	configuration('esm'),
	{
		input: 'source/index.ts',
		output: {
			dir: 'distribution/types',
      preserveModules: true,
      preserveModulesRoot: 'source',
		},
		plugins: [
			rmdir('types'),
			resolve(),
			dts({
				compilerOptions: {
					removeComments: false
				}
			}),
			indent(),
			{
				name: 'import',
				renderChunk: function (code: string): string {
					if(/@link Hitomi/g.test(code) && !code.includes('class Hitomi') && !code.includes('\'./hitomi.js\'')) {
						code = code.replace(/^$/m, 'import { Hitomi } from \'./hitomi.js\';\n');
					}

					if(/@link Gallery/g.test(code) && !code.includes('class Gallery') && !code.includes('\'./gallery.js\'')) {
						code = code.replace(/^$/m, 'import { Gallery } from \'./gallery.js\';\n');
					}

					return code;
				}
			}
		]
	}
] satisfies RollupOptions[];