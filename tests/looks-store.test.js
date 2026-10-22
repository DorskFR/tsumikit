import assert from 'node:assert/strict';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';

const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = 'tsumikit-theme';

const bundle = (
	await esbuild.build({
		stdin: {
			contents: `import { flushSync, mount } from 'svelte';
import LookPicker from '../src/lib/components/molecules/LookPicker.svelte';
import { theme, THEME_PREPAINT } from '../src/lib/stores/theme.svelte.ts';
import { trackPointer } from '../src/lib/pointer.ts';
globalThis.__fixture = { mount, flushSync, LookPicker, theme, THEME_PREPAINT, trackPointer };`,
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

/** @param {{ seed?: string, dark?: boolean }} [opts] */
function boot({ seed, dark = false } = {}) {
	const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
		url: 'http://localhost/'
	});
	const win = dom.window;
	if (seed !== undefined) win.localStorage.setItem(KEY, seed);
	win.matchMedia = /** @type {any} */ ((/** @type {string} */ q) => ({
		matches: dark && q.includes('dark'),
		media: q,
		addEventListener() {},
		removeEventListener() {}
	}));
	win.eval(bundle);
	const fx = win.__fixture;
	const root = win.document.documentElement;
	return {
		win,
		...fx,
		root,
		attr: (/** @type {string} */ n) => root.getAttribute(n),
		saved: () => JSON.parse(win.localStorage.getItem(KEY) ?? 'null')
	};
}

/** @param {string} seed @param {boolean} [dark] */
function prepaint(seed, dark = false) {
	const { THEME_PREPAINT } = boot();
	const dom = new JSDOM('<!doctype html><html></html>', { runScripts: 'outside-only', url: 'http://localhost/' });
	dom.window.localStorage.setItem(KEY, seed);
	dom.window.matchMedia = /** @type {any} */ ((/** @type {string} */ q) => ({ matches: dark && q.includes('dark') }));
	dom.window.eval(THEME_PREPAINT);
	const r = dom.window.document.documentElement;
	return { theme: r.getAttribute('data-theme'), mode: r.getAttribute('data-mode'), look: r.getAttribute('data-look') };
}

test('nothing saved: default look, no data-look, data-mode follows the painted theme', () => {
	const r = boot();
	assert.equal(r.theme.look, 'default');
	assert.equal(r.attr('data-look'), null);
	assert.equal(r.attr('data-theme'), 'dark');
	assert.equal(r.attr('data-mode'), 'dark');
});

test('a saved look paints data-look; an old blob without look stays on the default look', () => {
	const r = boot({ seed: JSON.stringify({ mode: 'light', light: 'sepia', dark: 'nord', look: 'depth' }) });
	assert.equal(r.theme.look, 'depth');
	assert.equal(r.attr('data-look'), 'depth');
	assert.equal(r.attr('data-theme'), 'sepia');
	assert.equal(r.attr('data-mode'), 'light');

	const old = boot({ seed: JSON.stringify({ mode: 'dark', light: 'light', dark: 'nord' }) });
	assert.equal(old.theme.look, 'default');
	assert.equal(old.attr('data-look'), null);

	const legacy = boot({ seed: 'gruvbox' });
	assert.equal(legacy.attr('data-theme'), 'gruvbox');
	assert.equal(legacy.theme.look, 'default');

	const junk = boot({ seed: JSON.stringify({ mode: 'dark', light: 'light', dark: 'dark', look: 'neon' }) });
	assert.equal(junk.theme.look, 'default');
	assert.equal(junk.attr('data-look'), null);
});

test('setLook paints and persists in the theme blob; default drops the key', () => {
	const r = boot();
	const seen = /** @type {unknown[]} */ ([]);
	r.theme.onchange = (/** @type {unknown} */ p) => seen.push(JSON.parse(JSON.stringify(p)));
	r.theme.setLook('tactile');
	assert.equal(r.attr('data-look'), 'tactile');
	assert.deepEqual(r.saved(), { mode: 'dark', light: 'light', dark: 'dark', look: 'tactile' });
	assert.deepEqual(seen.at(-1), { mode: 'dark', light: 'light', dark: 'dark', look: 'tactile' });

	r.theme.choose('sepia');
	assert.equal(r.attr('data-look'), 'tactile', 'a theme change keeps the look');
	assert.equal(r.attr('data-mode'), 'light');
	assert.deepEqual(r.saved(), { mode: 'light', light: 'sepia', dark: 'dark', look: 'tactile' });

	r.theme.setLook('default');
	assert.equal(r.attr('data-look'), null);
	assert.deepEqual(r.saved(), { mode: 'light', light: 'sepia', dark: 'dark' });

	r.theme.setLook('nope');
	assert.equal(r.theme.look, 'default');
});

test('hydrate applies a look when given and keeps the current one otherwise', () => {
	const r = boot();
	r.theme.setLook('editorial');
	r.theme.hydrate({ mode: 'dark', light: 'light', dark: 'nord' });
	assert.equal(r.theme.look, 'editorial');
	assert.equal(r.attr('data-theme'), 'nord');
	r.theme.hydrate({ mode: 'dark', light: 'light', dark: 'nord', look: 'depth' });
	assert.equal(r.attr('data-look'), 'depth');
	r.theme.hydrate({ mode: 'dark', light: 'light', dark: 'nord', look: 'default' });
	assert.equal(r.attr('data-look'), null);
});

test('the pre-paint script mirrors the store for blobs, auto, legacy ids and junk', () => {
	assert.deepEqual(prepaint(JSON.stringify({ mode: 'light', light: 'sepia', dark: 'nord', look: 'depth' })), {
		theme: 'sepia',
		mode: 'light',
		look: 'depth'
	});
	assert.deepEqual(prepaint(JSON.stringify({ mode: 'auto', light: 'sepia', dark: 'nord' }), true), {
		theme: 'nord',
		mode: 'dark',
		look: null
	});
	assert.deepEqual(prepaint(JSON.stringify({ mode: 'dark', light: 'light', dark: 'dark', look: 'neon' })), {
		theme: 'dark',
		mode: 'dark',
		look: null
	});
	assert.deepEqual(prepaint('latte'), { theme: 'latte', mode: 'light', look: null });
	assert.deepEqual(prepaint('{not json'), { theme: null, mode: null, look: null });
});

test('LookPicker lists the looks, badges experimental ones and drives the store', () => {
	const r = boot();
	const host = r.win.document.body.appendChild(r.win.document.createElement('div'));
	r.mount(r.LookPicker, { target: host });
	r.flushSync();
	const radios = () => [...host.querySelectorAll('[role="radio"]')];
	assert.deepEqual(
		radios().map((b) => b.getAttribute('aria-label')),
		['Polished', 'Depth', 'Tactile', 'Editorial']
	);
	assert.match(radios()[3].textContent ?? '', /beta/);
	assert.equal(radios()[3].querySelector('.look > .name + .tag')?.textContent, 'beta');
	assert.equal(radios()[0].getAttribute('aria-checked'), 'true');
	/** @type {HTMLElement} */ (radios()[1]).click();
	r.flushSync();
	assert.equal(r.theme.look, 'depth');
	assert.equal(r.attr('data-look'), 'depth');
	assert.equal(radios()[1].getAttribute('aria-checked'), 'true');

	const stable = r.win.document.body.appendChild(r.win.document.createElement('div'));
	r.mount(r.LookPicker, { target: stable, props: { experimental: false } });
	r.flushSync();
	assert.equal(stable.querySelectorAll('[role="radio"]').length, 3);
});

test('trackPointer sets box-relative vars on the hovered [data-tsu] chain, mouse only, until disposed', () => {
	const r = boot();
	const doc = r.win.document;
	doc.body.innerHTML = '<div data-tsu="Card" id="outer"><span><button data-tsu="Button" id="inner">x</button></span></div>';
	const outer = /** @type {HTMLElement} */ (doc.getElementById('outer'));
	const inner = /** @type {HTMLElement} */ (doc.getElementById('inner'));
	outer.getBoundingClientRect = () => /** @type {DOMRect} */ ({ left: 10, top: 20 });
	inner.getBoundingClientRect = () => /** @type {DOMRect} */ ({ left: 40, top: 50 });
	/** @type {Function[]} */
	const frames = [];
	r.win.requestAnimationFrame = (/** @type {Function} */ cb) => frames.push(cb);
	const move = (/** @type {string} */ pointerType, /** @type {number} */ x, /** @type {number} */ y) => {
		const e = new r.win.MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y });
		Object.defineProperty(e, 'pointerType', { value: pointerType });
		inner.dispatchEvent(e);
		for (const f of frames.splice(0)) f();
	};
	const stop = r.trackPointer(doc);
	move('touch', 100, 100);
	assert.equal(inner.style.getPropertyValue('--pointer-x'), '');
	move('mouse', 100, 100);
	assert.equal(inner.style.getPropertyValue('--pointer-x'), '60px');
	assert.equal(inner.style.getPropertyValue('--pointer-y'), '50px');
	assert.equal(outer.style.getPropertyValue('--pointer-x'), '90px');
	assert.equal(outer.style.getPropertyValue('--pointer-y'), '80px');
	stop();
	move('mouse', 200, 200);
	assert.equal(inner.style.getPropertyValue('--pointer-x'), '60px');
});
