import { RollupOptions } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
	input: 'source/index.ts',
	output: {
		file: 'library/index.js',
		format: 'cjs',
		generatedCode: {
			constBindings: true
		}
	},
	plugins: [typescript({
		module: 'ES2020'
	}), terser({
		format: {
			preamble: '/*\n * This is a minified bundle of node-hitomi.\n * https://github.com/H2Owater425/node-hitomi\n */'
		}
	})],
	external: ['crypto', 'https', 'tls']
} satisfies RollupOptions;