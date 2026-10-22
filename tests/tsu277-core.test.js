import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KEY = 'tsumikit-fx';
const read = (/** @type {string} */ p) => readFile(join(ROOT, p), 'utf8');

const bundle = (
	await esbuild.build({
		stdin: {
			contents: `import { flushSync, mount } from 'svelte';
import MotionSettings from '../src/lib/components/molecules/MotionSettings.svelte';
import { fx, FX_PREPAINT } from '../src/lib/stores/fx.svelte.ts';
import * as reg from '../src/lib/fx.ts';
globalThis.__fixture = { mount, flushSync, MotionSettings, fx, FX_PREPAINT, reg };`,
			resolveDir: HERE,
			loader: 'js'
		},
		bundle: true,
		write: false,
		format: 'iife',
		platform: 'browser',
		conditions: ['svelte', 'browser', 'import'],
		define: { 'import.meta.env.DEV': 'false' },
		alias: { $lib: `${HERE}/../src/lib` },
		plugins: [sveltePlugin({ compilerOptions: { css: 'injected' } })]
	})
).outputFiles[0].text;

/** @param {{ seed?: string, html?: string, reduced?: boolean }} [opts] */
function boot({ seed, html = '<html>', reduced = false } = {}) {
	const dom = new JSDOM(`<!doctype html>${html}<head></head><body></body></html>`, {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
		url: 'http://localhost/'
	});
	const win = dom.window;
	if (seed !== undefined) win.localStorage.setItem(KEY, seed);
	win.matchMedia = /** @type {any} */ ((/** @type {string} */ q) => ({
		matches: reduced && q.includes('reduce'),
		media: q,
		addEventListener() {},
		removeEventListener() {}
	}));
	win.eval(bundle);
	const root = win.document.documentElement;
	const fxAttrs = () =>
		Object.fromEntries([...root.attributes].filter((a) => a.name.startsWith('data-fx-')).map((a) => [a.name, a.value]));
	return {
		win,
		...win.__fixture,
		root,
		fxAttrs,
		saved: () => JSON.parse(win.localStorage.getItem(KEY) ?? 'null')
	};
}

/** @param {string} seed */
function prepaint(seed) {
	const { FX_PREPAINT } = boot();
	const dom = new JSDOM('<!doctype html><html></html>', { runScripts: 'outside-only', url: 'http://localhost/' });
	dom.window.localStorage.setItem(KEY, seed);
	dom.window.eval(FX_PREPAINT);
	const r = dom.window.document.documentElement;
	return Object.fromEntries([...r.attributes].filter((a) => a.name.startsWith('data-fx-')).map((a) => [a.name, a.value]));
}

/** @param {ReturnType<typeof boot>} r */
function open(r) {
	const panel = /** @type {HTMLElement} */ (r.win.document.querySelector('[popover]'));
	panel.dispatchEvent(Object.assign(new r.win.Event('toggle'), { newState: 'open' }));
	r.flushSync();
}

const plain = (/** @type {unknown} */ v) => JSON.parse(JSON.stringify(v));

const CONTRACT = {
	hover: ['smoke', 'ember', 'aurora', 'none'],
	check: ['draw', 'pop', 'confetti', 'morph', 'none'],
	radio: ['spring', 'liquid', 'none'],
	switch: ['squash', 'glow', 'calm', 'none'],
	focus: ['bloom', 'label', 'none'],
	tabs: ['pill', 'stretch', 'ink', 'none'],
	copy: ['burst', 'tick', 'none'],
	link: ['sweep', 'highlight', 'none'],
	card: ['spotlight', 'orbit', 'none']
};

test('registry matches the shared contract; the first variant is the default', () => {
	const { reg } = boot();
	assert.deepEqual(plain(reg.FX_FAMILIES), Object.keys(CONTRACT));
	for (const [f, ids] of Object.entries(CONTRACT)) {
		assert.deepEqual(
			plain(reg.FX[f].variants.map((/** @type {{id: string}} */ v) => v.id)),
			ids,
			f
		);
		assert.equal(reg.DEFAULT_FX[f], ids[0]);
		assert.equal(reg.fxAttr(f), `data-fx-${f}`);
	}
	assert.equal(reg.FX.hover.variants.at(-1).label, 'Off');
});

test('parseFx drops unknown families and variants', () => {
	const { reg } = boot();
	const s = reg.parseFx({ hover: 'ember', check: 'bogus', nope: 'x' });
	assert.equal(s.hover, 'ember');
	assert.equal(s.check, 'draw');
	assert.ok(!('nope' in s));
	assert.deepEqual(plain(reg.parseFx(null)), plain(reg.DEFAULT_FX));
	assert.deepEqual(plain(reg.parseFx('smoke')), plain(reg.DEFAULT_FX));
	assert.deepEqual(plain(reg.fxDiff(s)), { hover: 'ember' });
});

test('nothing saved: defaults, no data-fx-* written, app-set attributes kept', () => {
	const r = boot();
	assert.deepEqual(r.fxAttrs(), {});
	assert.equal(r.fx.isDefault, true);
	const kept = boot({ html: '<html data-fx-hover="none">' });
	assert.deepEqual(kept.fxAttrs(), { 'data-fx-hover': 'none' });
});

test('set paints and persists only non-default families; default removes the attribute', () => {
	const r = boot();
	/** @type {unknown[]} */
	const seen = [];
	r.fx.onchange = (/** @type {unknown} */ s) => seen.push(s);
	r.fx.set('hover', 'aurora');
	r.fx.set('card', 'none');
	assert.deepEqual(r.fxAttrs(), { 'data-fx-hover': 'aurora', 'data-fx-card': 'none' });
	assert.deepEqual(r.saved(), { hover: 'aurora', card: 'none' });
	assert.equal(r.fx.get('hover'), 'aurora');
	r.fx.set('hover', 'smoke');
	assert.deepEqual(r.fxAttrs(), { 'data-fx-card': 'none' });
	assert.deepEqual(r.saved(), { card: 'none' });
	assert.equal(seen.length, 3);
	r.fx.set('hover', 'bogus');
	assert.equal(seen.length, 3);
	r.fx.reset();
	assert.deepEqual(r.fxAttrs(), {});
	assert.deepEqual(r.saved(), {});
});

test('a saved blob is applied on boot; garbage falls back to defaults', () => {
	const r = boot({ seed: JSON.stringify({ check: 'morph', tabs: 'ink', link: 'nope' }) });
	assert.deepEqual(r.fxAttrs(), { 'data-fx-check': 'morph', 'data-fx-tabs': 'ink' });
	assert.equal(r.fx.get('link'), 'sweep');
	const bad = boot({ seed: '{not json' });
	assert.deepEqual(bad.fxAttrs(), {});
	assert.equal(bad.fx.isDefault, true);
});

test('hydrate replays settings without onchange', () => {
	const r = boot();
	let calls = 0;
	r.fx.onchange = () => calls++;
	r.fx.hydrate({ switch: 'calm' });
	assert.equal(calls, 0);
	assert.deepEqual(r.fxAttrs(), { 'data-fx-switch': 'calm' });
	assert.deepEqual(r.saved(), { switch: 'calm' });
});

test('FX_PREPAINT paints saved non-default variants and ignores the rest', () => {
	assert.deepEqual(prepaint(JSON.stringify({ hover: 'ember', radio: 'liquid', check: 'draw', link: 'bogus' })), {
		'data-fx-hover': 'ember',
		'data-fx-radio': 'liquid'
	});
	assert.deepEqual(prepaint('garbage'), {});
	assert.deepEqual(prepaint('"ember"'), {});
});

test('MotionSettings: one labelled select per family, a change sets the family', () => {
	const r = boot();
	const target = r.win.document.body;
	r.flushSync(() => r.mount(r.MotionSettings, { target, props: { families: ['check', 'switch'] } }));
	const trigger = target.querySelector('[data-tsu="MotionSettings"]');
	assert.ok(trigger, 'trigger rendered');
	open(r);
	const selects = [...r.win.document.querySelectorAll('select')];
	assert.equal(selects.length, 2);
	for (const s of selects) assert.ok(r.win.document.querySelector(`label[for="${s.id}"]`), 'label for select');
	assert.deepEqual(
		[...selects[1].options].map((o) => o.value),
		CONTRACT.switch
	);
	selects[1].value = 'calm';
	selects[1].dispatchEvent(new r.win.Event('change', { bubbles: true }));
	r.flushSync();
	assert.equal(r.fx.get('switch'), 'calm');
	assert.equal(r.root.getAttribute('data-fx-switch'), 'calm');
});

test('MotionSettings shows the reduced-motion hint when the system asks for it', () => {
	const r = boot({ reduced: true });
	const target = r.win.document.body;
	r.flushSync(() => r.mount(r.MotionSettings, { target, props: {} }));
	open(r);
	assert.match(r.win.document.body.textContent ?? '', /reduced motion/);
	assert.equal(r.win.document.querySelectorAll('select').length, Object.keys(CONTRACT).length);
});

test('exports, layout pre-paint and demo toolbar are wired', async () => {
	const index = await read('src/lib/index.ts');
	for (const name of ['MotionSettings', 'FX_PREPAINT', 'fx', 'FX', 'FX_FAMILIES', 'DEFAULT_FX', 'parseFx', 'fxPrepaint'])
		assert.match(index, new RegExp(`\\b${name}\\b`), name);
	assert.match(await read('src/routes/+layout.svelte'), /\$\{THEME_PREPAINT\}\$\{FX_PREPAINT\}/);
	assert.match(await read('src/demo/framework/DemoToolbar.svelte'), /<MotionSettings\b/);
});

test('MotionSettings styles use theme tokens only', async () => {
	const src = await read('src/lib/components/molecules/MotionSettings.svelte');
	const css = src.slice(src.indexOf('<style>'));
	assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
});
