import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

const entry = `
import { mount, flushSync } from 'svelte';
import Example from ${JSON.stringify(join(ROOT, 'src/demo/framework/Example.svelte'))};
import Preview from ${JSON.stringify(join(ROOT, 'src/lib/components/atoms/Badge.svelte'))};
globalThis.__fixture = { mount, flushSync, Example, Preview };
`;
const out = await esbuild.build({
	stdin: { contents: entry, resolveDir: ROOT, loader: 'js' },
	bundle: true,
	write: false,
	format: 'iife',
	platform: 'browser',
	conditions: ['svelte', 'browser', 'import'],
	define: { 'import.meta.env.DEV': 'false' },
	alias: { $lib: join(ROOT, 'src/lib'), '@dorsk/tsumikit': join(ROOT, 'src/lib') },
	plugins: [
		{
			name: 'spy-highlight',
			setup(build) {
				build.onResolve({ filter: /^\.\/highlight$/ }, () => ({ path: 'highlight', namespace: 'spy' }));
				build.onLoad({ filter: /.*/, namespace: 'spy' }, () => ({
					contents:
						'export function highlight(code) { globalThis.__highlights = (globalThis.__highlights ?? 0) + 1; return code.replaceAll("&", "&amp;").replaceAll("<", "&lt;"); }',
					loader: 'js'
				}));
			}
		},
		sveltePlugin({ compilerOptions: { css: 'injected' } })
	]
});
const bundle = out.outputFiles[0].text;

test('Example renders no CodeBlock and runs no highlight until its code Disclosure opens', () => {
	const d = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
		url: 'http://localhost/tsumikit/'
	});
	d.window.matchMedia = /** @type {any} */ (
		() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
	);
	d.window.eval(bundle);
	const { mount, flushSync, Example, Preview } = d.window.__fixture;
	const win = /** @type {any} */ (d.window);
	const example = {
		id: 'badge--basic',
		file: 'Basic.svelte',
		source: '<Badge>New</Badge>',
		component: Preview,
		meta: { title: 'Basic' }
	};
	mount(Example, { target: d.window.document.body, props: { example } });
	flushSync();
	const card = /** @type {HTMLElement} */ (d.window.document.getElementById('badge--basic'));
	const toggle = /** @type {HTMLButtonElement} */ (card.querySelector('[data-tsu="Disclosure"] button'));
	assert.equal(toggle.getAttribute('aria-expanded'), 'false');
	assert.equal(card.querySelector('[data-tsu="CodeBlock"]'), null);
	assert.equal(win.__highlights, undefined);
	toggle.click();
	flushSync();
	assert.equal(card.querySelector('[data-tsu="CodeBlock"] code, [data-tsu="CodeBlock"] pre')?.textContent, example.source);
	assert.ok(win.__highlights >= 1);
	toggle.click();
	flushSync();
	assert.ok(card.querySelector('[data-tsu="CodeBlock"]'), 'the code stays rendered after closing');
});
