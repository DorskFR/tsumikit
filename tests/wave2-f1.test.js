import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import * as esbuild from 'esbuild';
import esbuildSvelte from 'esbuild-svelte';
import { JSDOM } from 'jsdom';
import { compile, preprocess } from 'svelte/compiler';
import { hasDecl, normalize } from './helpers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIB = join(HERE, '../src/lib');
const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/components/${p}`, import.meta.url), 'utf8');

const FILES = [
	'atoms/Button.svelte',
	'atoms/Kbd.svelte',
	'atoms/Link.svelte',
	'atoms/Swatch.svelte',
	'molecules/IconButton.svelte',
	'molecules/FileButton.svelte',
	'molecules/OptionButton.svelte',
	'molecules/SelectButton.svelte',
	'molecules/SplitButton.svelte',
	'molecules/CopyButton.svelte',
	'molecules/Pagination.svelte',
	'molecules/LoadMore.svelte',
	'molecules/Breadcrumb.svelte'
];
const sources = Object.fromEntries(await Promise.all(FILES.map(async (f) => [f, await read(f)])));
const styleOf = (/** @type {string} */ f) => {
	const s = sources[f];
	const i = s.indexOf('<style>');
	return i === -1 ? '' : s.slice(i);
};

/** Records every playSound call instead of touching audio. */
const STUB_SOUND = {
	name: 'stub-sound',
	setup(/** @type {import('esbuild').PluginBuild} */ b) {
		b.onResolve({ filter: /(^\$lib\/sound$)|(\/sound(\.ts)?$)/ }, () => ({ path: 'stub-sound', namespace: 'stub' }));
		b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
			contents: `export function playSound(name, allow = true) { globalThis.__sounds.push([name, allow]); }`,
			loader: 'js'
		}));
	}
};

const bundle = (
	await esbuild.build({
		stdin: {
			contents: `import { flushSync, mount } from 'svelte';
import Fixture from './fixtures/Wave2F1Fixture.svelte';
globalThis.__fixture = { mount, flushSync, Fixture };`,
			resolveDir: HERE,
			loader: 'js'
		},
		bundle: true,
		write: false,
		format: 'iife',
		platform: 'browser',
		conditions: ['svelte', 'browser', 'import'],
		define: { 'import.meta.env.DEV': 'false' },
		alias: { $lib: LIB },
		plugins: [STUB_SOUND, esbuildSvelte({ compilerOptions: { css: 'injected' } })]
	})
).outputFiles[0].text;

/** @param {Record<string, unknown>} [props] @param {{ clipboard?: boolean }} [opts] */
function render(props = {}, { clipboard = true } = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
		url: 'http://localhost/'
	});
	const win = dom.window;
	/** @type {[string, boolean][]} */
	const sounds = [];
	win.__sounds = sounds;
	if (clipboard) Object.defineProperty(win.navigator, 'clipboard', { value: { writeText: async () => {} } });
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	mount(Fixture, { target: win.document.body, props });
	flushSync();
	const doc = win.document;
	const q = (/** @type {string} */ sel) => {
		const el = /** @type {HTMLElement | null} */ (doc.querySelector(sel));
		assert.ok(el, sel);
		return el;
	};
	/** Calls that would make a sound: `allow === false` is the no-op branch of playSound. */
	const played = () => sounds.filter(([, allow]) => allow !== false);
	const click = (/** @type {Element} */ el) => {
		el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }));
		flushSync();
	};
	return { win, doc, q, click, sounds, played, flushSync };
}

const settle = () => new Promise((r) => setTimeout(r, 0));
/** jsdom arrays live in another realm: compare by value. */
const same = (/** @type {unknown} */ actual, /** @type {unknown} */ expected, /** @type {string} */ msg = '') =>
	assert.equal(JSON.stringify(actual), JSON.stringify(expected), msg);

test('nothing plays on mount', () => {
	same(render().sounds, []);
});

test('Button, IconButton, OptionButton, LoadMore play one click per activation', () => {
	const r = render();
	r.click(r.q('#btn'));
	same(r.sounds, [['click', true]]);
	r.click(r.q('#ib'));
	r.click(r.q('#opt'));
	r.click(r.q('.lm button'));
	same(r.sounds, [
		['click', true],
		['click', true],
		['click', true],
		['click', true]
	]);
});

test('FileButton plays on the input activation that opens the picker', () => {
	const r = render();
	const input = /** @type {HTMLInputElement} */ (r.q('.fb input'));
	input.dispatchEvent(new r.win.MouseEvent('click', { bubbles: true, cancelable: true }));
	same(r.sounds, [['click', true]]);
});

test('SelectButton plays on a value change', () => {
	const r = render();
	const select = /** @type {HTMLSelectElement} */ (r.q('.sb select'));
	select.value = 'b';
	select.dispatchEvent(new r.win.Event('change', { bubbles: true }));
	r.flushSync();
	same(r.sounds, [['click', true]]);
});

test('Pagination plays once per page change and stays silent on a no-op', () => {
	const r = render();
	r.click(r.q('.pg [aria-label="Previous page"]'));
	same(r.played(), [['click', true]], 'prev arrow: one click, not Button + go');
	r.click(r.q('.pg [aria-label="Page 1"]'));
	assert.equal(r.played().length, 1, 'already on page 1');
	r.click(r.q('.pg [aria-label="Page 5"]'));
	same(r.played(), [['click', true], ['click', true]]);
});

test('CopyButton plays success or error, never the inner click', async () => {
	const ok = render();
	ok.click(ok.q('.cp'));
	await settle();
	same(ok.played(), [['success', true]]);
	const bad = render({}, { clipboard: false });
	bad.click(bad.q('.cp'));
	await settle();
	same(bad.played(), [['error', true]]);
});

test('sound={false} is forwarded to every hook; disabled controls never play', () => {
	const r = render({ sound: false });
	r.click(r.q('#btn'));
	r.click(r.q('#ib'));
	r.click(r.q('#opt'));
	r.click(r.q('.pg [aria-label="Page 3"]'));
	r.click(r.q('.lm button'));
	assert.ok(r.sounds.length >= 5);
	same(r.played(), []);
	const d = render({ disabled: true });
	d.click(d.q('#btn'));
	d.click(d.q('#ib'));
	d.click(d.q('#opt'));
	same(d.sounds, []);
});

test('every hooked component exposes the sound prop defaulting to true', () => {
	for (const f of [
		'atoms/Button.svelte',
		'molecules/IconButton.svelte',
		'molecules/FileButton.svelte',
		'molecules/OptionButton.svelte',
		'molecules/SelectButton.svelte',
		'molecules/SplitButton.svelte',
		'molecules/CopyButton.svelte',
		'molecules/Pagination.svelte',
		'molecules/LoadMore.svelte'
	]) {
		assert.match(sources[f], /sound\?: boolean;/, f);
		assert.match(sources[f], /sound = true,/, f);
		assert.doesNotMatch(sources[f], /sound-synth/, f);
	}
});

test('hover rules only run on hover-capable fine pointers', () => {
	for (const f of FILES) {
		const css = styleOf(f);
		if (!css) continue;
		const gatedCss = (css.match(/@media \(hover: hover\) and \(pointer: fine\)\s*{[\s\S]*?\n\t}\n/g) ?? []).join('\n');
		const total = (css.match(/:hover/g) ?? []).length;
		const gated = (gatedCss.match(/:hover/g) ?? []).length;
		assert.equal(gated, total, `${f}: ${total - gated} ungated :hover`);
	}
});

test('press feedback: scale from the press tokens, press-in at --dur-press on --ease-out, spring release from tokens, no motion when disabled', () => {
	const button = styleOf('atoms/Button.svelte');
	const press = button.match(/\.btn:active:not\(([^)]*)\)\s*{([^}]*)}/s);
	assert.ok(press);
	assert.match(press[1], /:disabled/);
	assert.match(press[1], /\.loading/);
	assert.match(press[1], /\.btn-link/);
	assert.match(press[2], /scale: var\(--press-scale\);/);
	assert.match(press[2], /--btn-scale-dur: var\(--dur-press\);/);
	assert.match(press[2], /--btn-scale-ease: var\(--ease-out\);/);
	assert.match(button, /\.btn-icon:active:not\([^)]*\),[\s\S]*?{\s*scale: var\(--press-scale-sm\);/);
	assert.match(button, /--btn-scale-dur: var\(--dur-release\);\s*--btn-scale-ease: var\(--ease-spring-bounce\);/);
	assert.match(button, /scale var\(--btn-scale-dur\) var\(--btn-scale-ease\)/);
	for (const [f, sel, token] of [
		['molecules/FileButton.svelte', '.file-btn:active:not(.disabled)', '--press-scale'],
		['molecules/OptionButton.svelte', '.opt:active:not(:disabled)', '--press-scale'],
		['molecules/Pagination.svelte', '.page:active', '--press-scale'],
		['atoms/Swatch.svelte', '.interactive:active', '--press-scale-sm'],
		['molecules/SelectButton.svelte', '.select-button:active :global(.btn-ghost)', '--press-scale-sm']
	]) {
		assert.ok(hasDecl(styleOf(f), sel, 'scale', `var(${token})`), `${f} ${sel}`);
	}
});

test('motion literals are gone: tokens only, individual transform properties, no transition: all', () => {
	for (const f of FILES) {
		const css = styleOf(f);
		assert.doesNotMatch(css.replace(/animation: [^;]+;/g, ''), /\b0\.\d+s\b|\b\d+ms\b/, `${f}: duration literal`);
		assert.doesNotMatch(css, /cubic-bezier/, `${f}: easing literal`);
		assert.doesNotMatch(css, /transition:\s*all/, `${f}: transition all`);
		assert.doesNotMatch(css, /transition:[^;]*\btransform\b/, `${f}: transition on transform`);
		assert.doesNotMatch(css, /prefers-reduced-motion/, `${f}: reset.css owns reduced motion`);
	}
	assert.doesNotMatch(styleOf('atoms/Button.svelte'), /transition:[^;]*\b(width|height|padding|margin)\b/);
});

test('polish sweeps: no literal disabled opacity, focus ring, radius, line-height or off-scale spacing', () => {
	for (const f of FILES) {
		const css = styleOf(f);
		assert.doesNotMatch(css, /opacity: 0\.45|opacity: 0\.6\b/, `${f}: disabled literal`);
		assert.doesNotMatch(css, /outline: 2px|outline-offset: -?\d/, `${f}: focus literal`);
		assert.doesNotMatch(css, /border-radius: [1-9]/, `${f}: radius literal`);
		assert.doesNotMatch(css, /line-height: [0-9.]+(rem)?;/, `${f}: line-height literal`);
		assert.doesNotMatch(css, /(gap|padding|top|left): [0-9.]+(px|rem)\b(?! solid)/, `${f}: spacing literal`);
		assert.doesNotMatch(css, /font-size: [0-9.]+(rem|em)/, `${f}: font-size literal`);
	}
	assert.doesNotMatch(sources['molecules/SplitButton.svelte'], /size=\{size === 'sm' \? 14 : 16\}/);
	assert.doesNotMatch(sources['molecules/Breadcrumb.svelte'], /size=\{size === 'md' \? 16 : 14\}/);
});

test('Button reads the per-tier tokens: height ladder, label size, padding, icon size', () => {
	const css = styleOf('atoms/Button.svelte');
	assert.ok(hasDecl(css, '.btn', 'padding', 'var(--sp-2) var(--btn-px-md)'));
	assert.ok(hasDecl(css, '.btn', 'font-size', 'var(--control-fs-md)'));
	assert.ok(hasDecl(css, '.btn', '--icon-size', 'var(--control-icon-md)'));
	assert.ok(hasDecl(css, '.btn', 'line-height', 'var(--lh-none)'));
	assert.ok(hasDecl(css, '.btn-sm', 'padding', 'var(--sp-1) var(--btn-px-sm)'));
	assert.ok(hasDecl(css, '.btn-sm', 'font-size', 'var(--control-fs-sm)'));
	assert.ok(hasDecl(css, '.btn-sm', '--icon-size', 'var(--control-icon-sm)'));
	assert.ok(hasDecl(css, '.btn-lg', 'padding', 'var(--sp-3) var(--btn-px-lg)'));
	assert.ok(hasDecl(css, '.btn-lg', 'font-size', 'var(--control-fs-lg)'));
	assert.ok(hasDecl(css, '.btn-lg', '--icon-size', 'var(--control-icon-lg)'));
	assert.ok(hasDecl(css, '.btn-glyph', 'font-size', 'var(--icon-size)'));
	assert.ok(hasDecl(css, '.btn:disabled', 'opacity', 'var(--disabled-opacity)'));
	assert.ok(hasDecl(css, '.btn-spinner', 'border-radius', 'var(--r-pill)'));
	assert.match(css, /@starting-style\s*{\s*\.btn-spinner\s*{\s*opacity: 0;/);
	const file = styleOf('molecules/FileButton.svelte');
	assert.ok(hasDecl(file, '.file-btn', 'min-height', 'var(--control-height-default)'));
	assert.ok(hasDecl(file, '.file-btn.sm', 'min-height', 'var(--control-height-compact)'));
	assert.ok(hasDecl(file, '.file-btn.lg', 'min-height', 'var(--control-height-large)'));
	assert.ok(hasDecl(file, '.file-btn:focus-within', 'outline', 'var(--focus-ring)'));
	const page = styleOf('molecules/Pagination.svelte');
	assert.ok(hasDecl(page, '.page', 'border-radius', 'var(--r-md)'));
	assert.ok(hasDecl(page, '.page', 'font-size', 'var(--control-fs-md)'));
	assert.ok(hasDecl(page, '.page', 'padding', '0 var(--control-px-md)'));
});

test('a long Button label wraps inside its container instead of overflowing', () => {
	const css = styleOf('atoms/Button.svelte');
	assert.ok(hasDecl(css, '.btn', 'white-space', 'normal'));
	assert.ok(hasDecl(css, '.btn', 'overflow-wrap', 'break-word'));
	assert.ok(hasDecl(css, '.btn', 'max-width', '100%'));
	assert.ok(!hasDecl(css, '.btn-sm', 'height'), 'sm keeps min-height only so two lines fit');
	assert.ok(hasDecl(styleOf('molecules/LoadMore.svelte'), '.load-more', 'flex-shrink', '0'));
});

test('CopyButton stacks both glyphs in one cell: check springs in, copy fades out faster', () => {
	const css = styleOf('molecules/CopyButton.svelte');
	assert.ok(hasDecl(css, '.glyphs', 'display', 'inline-grid'));
	assert.ok(hasDecl(css, '.glyph', 'grid-area', '1 / 1'));
	assert.ok(hasDecl(css, '.check', 'scale', '0.6'));
	assert.match(normalize(css), /\.copied \.check { opacity: 1; scale: 1; transition: opacity var\(--dur-spring-bounce\) ease, scale var\(--dur-spring-bounce\) var\(--ease-spring-bounce\); }/);
	assert.ok(hasDecl(css, '.copied .copy', 'transition-duration', 'var(--dur-exit-fast)'));
	const r = render();
	assert.equal(r.q('.cp .glyphs').classList.contains('copied'), false);
	assert.equal(r.q('.cp .copy svg') !== null && r.q('.cp .check svg') !== null, true);
});

test('SplitButton half caret keeps a 24px hit box on coarse pointers', () => {
	const flat = normalize(styleOf('molecules/SplitButton.svelte'));
	assert.match(flat, /@media \(pointer: coarse\) { \.split-half \.split-caret { min-width: var\(--box-xs\); } }/);
});

test('every F1 component compiles for client and server', async () => {
	for (const f of FILES) {
		const { code } = await preprocess(sources[f], vitePreprocess(), { filename: f });
		for (const generate of /** @type {const} */ (['client', 'server'])) {
			const out = compile(code, { generate, filename: f });
			const bad = out.warnings.filter((w) => !/^(a11y|css_unused_selector)/.test(w.code));
			same(bad.map((w) => `${f}: ${w.code} ${w.message}`), []);
		}
	}
});
