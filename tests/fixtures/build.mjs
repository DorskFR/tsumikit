import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Bundle the FilterInput fixture into one browser script, for jsdom to evaluate. */
export async function buildFixture() {
	const out = await esbuild.build({
		entryPoints: [join(HERE, 'mount-fixture.js')],
		bundle: true,
		write: false,
		format: 'iife',
		platform: 'browser',
		conditions: ['svelte', 'browser', 'import'],
		define: { 'import.meta.env.DEV': 'false' },
		alias: { $lib: join(HERE, '../../src/lib') },
		plugins: [sveltePlugin({ compilerOptions: { css: 'injected' } })]
	});
	return out.outputFiles[0].text;
}
