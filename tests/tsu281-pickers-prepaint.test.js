import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';
import { compile, preprocess } from 'svelte/compiler';

const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = 'tsumikit-theme';
const LOOKS = ['default', 'depth', 'tactile', 'editorial'];

/** @param {'client' | 'server'} generate @param {string} contents */
const bundle = async (generate, contents) =>
	(
		await esbuild.build({
			stdin: { contents, resolveDir: HERE, loader: 'js' },
			bundle: true,
			write: false,
			format: generate === 'client' ? 'iife' : 'esm',
			platform: generate === 'client' ? 'browser' : 'node',
			conditions: generate === 'client' ? ['svelte', 'browser', 'import'] : ['svelte', 'import'],
			define: { 'import.meta.env.DEV': 'false' },
			alias: { $lib: `${HERE}/../src/lib` },
			plugins: [sveltePlugin({ compilerOptions: { generate, css: 'injected' } })]
		})
	).outputFiles[0].text;

const imports = `import LookPicker from '../src/lib/components/molecules/LookPicker.svelte';
import ThemePicker from '../src/lib/components/molecules/ThemePicker.svelte';`;
const client = await bundle(
	'client',
	`import { flushSync, mount } from 'svelte';
${imports}
globalThis.__fixture = { mount, flushSync, LookPicker, ThemePicker };`
);
const server = await import(
	`data:text/javascript;base64,${Buffer.from(
		await bundle('server', `import { render } from 'svelte/server';\n${imports}\nexport { render, LookPicker, ThemePicker };`)
	).toString('base64')}`
);

const lookSource = await readFile(new URL('../src/lib/components/molecules/LookPicker.svelte', import.meta.url), 'utf8');
const lookCss = compile((await preprocess(lookSource, vitePreprocess(), { filename: 'LookPicker.svelte' })).code, {
	filename: 'LookPicker.svelte',
	css: 'external'
}).css?.code;

test('mounted after a saved look and theme, the pickers render the saved selection on their first frame', () => {
	const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
		url: 'http://localhost/'
	});
	const win = dom.window;
	win.localStorage.setItem(KEY, JSON.stringify({ mode: 'light', light: 'sepia', dark: 'dark', look: 'editorial' }));
	win.matchMedia = /** @type {any} */ ((/** @type {string} */ media) => ({
		matches: false,
		media,
		addEventListener() {},
		removeEventListener() {}
	}));
	win.eval(client);
	const { mount, flushSync, LookPicker, ThemePicker } = win.__fixture;
	const host = win.document.body.appendChild(win.document.createElement('div'));
	mount(LookPicker, { target: host });
	mount(ThemePicker, { target: host });
	flushSync();

	const checked = [...host.querySelectorAll('[role="radio"][aria-checked="true"]')];
	assert.deepEqual(
		checked.map((b) => b.getAttribute('aria-label')),
		['Editorial']
	);
	const trigger = host.querySelector('[data-tsu="ThemePicker"]');
	assert.equal(trigger?.querySelector('.swatch')?.getAttribute('data-theme'), 'sepia');
	assert.equal(trigger?.getAttribute('title'), 'Theme: Sepia');
});

test('prerendered pickers bake no default selection, so they follow what the prepaint put on <html>', () => {
	const look = server.render(server.LookPicker, { props: {} }).body;
	const themeHtml = server.render(server.ThemePicker, { props: {} }).body;
	assert.ok(lookCss, 'LookPicker ships CSS');
	const dom = new JSDOM(`<!doctype html><html><head><style>${lookCss}</style></head><body>${look}${themeHtml}</body></html>`);
	const doc = dom.window.document;

	assert.equal(doc.querySelectorAll('[role="radio"]').length, 4);
	assert.equal(doc.querySelectorAll('[role="radio"][aria-checked="true"]').length, 0, 'no option checked before hydration');

	const swatch = doc.querySelector('[data-tsu="ThemePicker"] .swatch');
	assert.ok(swatch);
	assert.equal(swatch.hasAttribute('data-theme'), false, 'the trigger swatch inherits the <html> theme');
	assert.equal(doc.querySelector('[data-tsu="ThemePicker"]')?.getAttribute('title'), 'Theme');

	const rule = [...doc.styleSheets[0].cssRules].find((r) => /data-look-option/.test(/** @type {CSSStyleRule} */ (r).selectorText ?? ''));
	assert.ok(rule, 'a prepaint rule keyed on <html data-look>');
	const selector = /** @type {CSSStyleRule} */ (rule).selectorText;
	const shown = () =>
		[...doc.querySelectorAll('.seg-item')].filter((el) => el.matches(selector)).map((el) => el.getAttribute('aria-label'));
	const label = { default: 'Polished', depth: 'Depth', tactile: 'Tactile', editorial: 'Editorial' };
	for (const id of LOOKS) {
		if (id === 'default') doc.documentElement.removeAttribute('data-look');
		else doc.documentElement.setAttribute('data-look', id);
		assert.deepEqual(shown(), [label[/** @type {keyof typeof label} */ (id)]], id);
	}

	doc.querySelector('.seg-item')?.classList.add('selected');
	doc.documentElement.setAttribute('data-look', 'depth');
	assert.deepEqual(shown(), [], 'once hydrated the real selection takes over');
});

test('the prepaint rule covers every registered look', async () => {
	const { LOOKS: registered } = await import('../src/lib/theme-mode.ts');
	assert.deepEqual(
		registered.map((/** @type {{ id: string }} */ l) => l.id),
		LOOKS
	);
	for (const id of LOOKS) assert.match(lookSource, new RegExp(`\\[data-look-option='${id}'\\]`), id);
	assert.match(
		lookSource,
		/:root\[data-look='editorial'\] \.look-picker:not\(:has\(\.selected\)\) \.seg-item:has\(> \[data-look-option='editorial'\]\)\) \{\s*color: var\(--bg\);/,
		'editorial inverts the selected segment (text fill), so its label takes the background color'
	);
});

test('on phone widths, where the toolbar drops its Look control, the drawer offers one', async () => {
	const shell = await readFile(new URL('../src/demo/framework/DemoShell.svelte', import.meta.url), 'utf8');
	assert.match(shell, /\{#snippet sidebar\(\)\}\s*<div class="demo-drawer-look">\s*<SelectButton\s+variant="row"\s+block/);
	assert.match(shell, /label="Look: \{lookLabel\}"\s+value=\{theme\.look\}\s+options=\{looks\}\s+onchange=\{\(v\) => theme\.setLook\(v\)\}/);
	assert.match(shell, /const looks = LOOKS\.map\(/);
	assert.match(
		shell,
		/@media \(max-width: 40rem\) \{\s*:global\(\.shell-header \.cq-hide\) \{\s*display: none;\s*\}\s*\.demo-drawer-look \{\s*display: block;/
	);
	assert.match(shell, /\.demo-drawer-look \{\s*display: none;/);
});
