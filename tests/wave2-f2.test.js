import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';
import { hasDecl, rule } from './helpers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/components/${p}`, import.meta.url), 'utf8');
const css = (/** @type {string} */ src) => src.slice(src.indexOf('<style>'));

const files = {
	Checkbox: await read('atoms/Checkbox.svelte'),
	Switch: await read('atoms/Switch.svelte'),
	Badge: await read('atoms/Badge.svelte'),
	RadioGroup: await read('molecules/RadioGroup.svelte'),
	Toggle: await read('molecules/Toggle.svelte'),
	SegmentedControl: await read('molecules/SegmentedControl.svelte'),
	Tabs: await read('molecules/Tabs.svelte'),
	AttachmentList: await read('molecules/AttachmentList.svelte'),
	GlyphStack: await read('molecules/GlyphStack.svelte'),
	TabBar: await read('layouts/TabBar.svelte')
};

/** Records every playSound call instead of touching the sound store. */
const STUB_SOUND = {
	name: 'stub-sound',
	setup(/** @type {import('esbuild').PluginBuild} */ b) {
		b.onResolve({ filter: /(^|\/)sound$/ }, () => ({ path: 'stub-sound', namespace: 'stub' }));
		b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
			contents: `export function playSound(name, allow = true) { globalThis.__sounds.push([name, allow]); }`,
			loader: 'js'
		}));
	}
};
const bundle = (
	await esbuild.build({
		entryPoints: [join(HERE, 'fixtures/mount-wave2-f2.js')],
		bundle: true,
		write: false,
		format: 'iife',
		platform: 'browser',
		conditions: ['svelte', 'browser', 'import'],
		define: { 'import.meta.env.DEV': 'false' },
		alias: { $lib: join(HERE, '../src/lib') },
		plugins: [STUB_SOUND, sveltePlugin({ compilerOptions: { css: 'injected' } })]
	})
).outputFiles[0].text;

function render(/** @type {Record<string, unknown>} */ props = {}) {
	const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const win = dom.window;
	win.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
	win.__sounds = [];
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	mount(Fixture, { target: win.document.body, props });
	flushSync();
	const doc = win.document;
	const click = (/** @type {Element} */ el) => {
		/** @type {HTMLElement} */ (el).click();
		flushSync();
	};
	const sounds = () => JSON.parse(JSON.stringify(win.__sounds.splice(0)));
	return { doc, click, sounds, flush: flushSync };
}

test('nothing plays on mount with checked / selected state already set', () => {
	const r = render();
	assert.deepEqual(r.sounds(), []);
});

test('each control plays its mapped sound once per interaction, by the new state', () => {
	const r = render();
	const cb = /** @type {HTMLInputElement} */ (r.doc.querySelector('[data-probe="cb"]'));
	r.click(cb);
	assert.deepEqual(r.sounds(), [['toggle-off', true]]);
	r.click(cb);
	assert.deepEqual(r.sounds(), [['toggle-on', true]]);

	const sw = /** @type {HTMLElement} */ (r.doc.querySelector('[data-probe="sw"]'));
	r.click(sw);
	assert.deepEqual(r.sounds(), [['toggle-off', true]]);
	assert.equal(sw.getAttribute('aria-checked'), 'false');

	const tg = /** @type {HTMLElement} */ (r.doc.querySelector('[data-probe="tg"]'));
	r.click(tg);
	assert.deepEqual(r.sounds(), [['toggle-on', true]]);
	assert.equal(tg.getAttribute('aria-pressed'), 'true');
	r.click(tg);
	assert.deepEqual(r.sounds(), [['toggle-off', true]]);

	const radios = r.doc.querySelectorAll('[data-tsu="RadioGroup"] input');
	r.click(radios[1]);
	assert.deepEqual(r.sounds(), [['click', true]]);

	const segs = r.doc.querySelectorAll('[data-tsu="SegmentedControl"] .seg-item');
	r.click(segs[1]);
	assert.deepEqual(r.sounds(), [['click', true]]);
	r.click(segs[1]);
	assert.deepEqual(r.sounds(), [], 're-selecting the current segment is silent');

	const tabs = r.doc.querySelectorAll('[data-tsu="Tabs"] .tab');
	r.click(tabs[1]);
	assert.deepEqual(r.sounds(), [['click', true]]);
	r.click(tabs[1]);
	assert.deepEqual(r.sounds(), []);

	const bar = r.doc.querySelectorAll('[data-tsu="TabBar"] .tabbar-item');
	r.click(bar[1]);
	assert.deepEqual(r.sounds(), [['click', true]]);
	r.click(bar[1]);
	assert.deepEqual(r.sounds(), []);
});

test('sound={false} passes allow=false to every hook', () => {
	const r = render({ silent: true });
	r.click(r.doc.querySelector('[data-probe="cb"]'));
	r.click(r.doc.querySelector('[data-probe="sw"]'));
	r.click(r.doc.querySelector('[data-probe="tg"]'));
	r.click(r.doc.querySelectorAll('[data-tsu="RadioGroup"] input')[1]);
	r.click(r.doc.querySelectorAll('[data-tsu="SegmentedControl"] .seg-item')[1]);
	r.click(r.doc.querySelectorAll('[data-tsu="Tabs"] .tab')[1]);
	r.click(r.doc.querySelectorAll('[data-tsu="TabBar"] .tabbar-item')[1]);
	const calls = r.sounds();
	assert.equal(calls.length, 7);
	assert.ok(calls.every(([, allow]) => allow === false));
});

test('Tabs and SegmentedControl keep a sliding marker that only animates translate and scale', () => {
	const r = render();
	const ind = /** @type {HTMLElement} */ (r.doc.querySelector('[data-tsu="Tabs"] .indicator'));
	const thumb = /** @type {HTMLElement} */ (r.doc.querySelector('[data-tsu="SegmentedControl"] .seg-thumb'));
	assert.ok(ind && thumb);
	assert.equal(ind.getAttribute('aria-hidden'), 'true');
	for (const [name, sel] of [
		['Tabs', '.indicator'],
		['SegmentedControl', '.seg-thumb']
	]) {
		const t = rule(css(files[name]), sel).transition ?? '';
		assert.match(t, /translate var\(--dur-spring\) var\(--ease-spring\)/, name);
		assert.match(t, /scale var\(--dur-spring\) var\(--ease-spring\)/, name);
		assert.doesNotMatch(t, /\b(width|left|height|top)\b/, name);
	}
	assert.match(css(files.Tabs), /\.tablist:not\(\.placed\) \.tab\.selected\s*{[^}]*border-bottom-color: var\(--accent\)/);
	assert.match(css(files.SegmentedControl), /\.seg\.placed \.seg-item\.selected\s*{[^}]*background: transparent/);
});

test('every :hover rule sits under the fine-pointer hover media query', () => {
	for (const [name, src] of Object.entries(files)) {
		const style = css(src);
		const gated = style.match(/@media \(hover: hover\) and \(pointer: fine\)\s*{[\s\S]*?\n\t}\n/g) ?? [];
		const outside = gated.reduce((acc, block) => acc.replace(block, ''), style);
		assert.equal((outside.match(/:hover/g) ?? []).length, 0, `${name} has an ungated :hover`);
	}
});

test('press feedback is a transform on :active, never on disabled controls', () => {
	assert.match(css(files.Checkbox), /\.checkbox:active:not\(:has\(input:disabled\)\) \.box\s*{[^}]*scale: var\(--press-scale-sm\)/);
	assert.match(css(files.Switch), /\.switch:active:not\(:disabled\) \.knob\s*{[^}]*scale: calc\(1 \+ \(var\(--press-scale\) - var\(--press-scale-sm\)\) \* 2\.4\) 1/);
	assert.match(css(files.Toggle), /\.toggle:active:not\(:disabled\)\s*{[^}]*scale: var\(--press-scale\)/);
	assert.match(css(files.Badge), /\.action:active\s*{[^}]*scale: var\(--press-scale-sm\)/);
	assert.match(css(files.TabBar), /\.tabbar-item:active \.tabbar-glyph\s*{[^}]*scale: var\(--press-scale-sm\)/);
});

test('toggle marks spring in and fade out faster; motion reads tokens only', () => {
	const cb = css(files.Checkbox);
	assert.match(rule(cb, 'input:checked + .box::after').transition, /var\(--dur-spring\) var\(--ease-spring\)/);
	assert.match(rule(cb, '.box::after').transition, /var\(--dur-exit-fast\)/);
	const rg = css(files.RadioGroup);
	assert.match(rule(rg, 'input:checked + .dot-ctl::after').transition, /var\(--dur-spring\) var\(--ease-spring\)/);
	assert.match(rule(rg, '.dot-ctl::after').transition, /var\(--dur-exit-fast\)/);
	assert.match(rule(css(files.Switch), '.switch .knob').transition, /translate var\(--dur-spring\) var\(--ease-spring\)/);
	for (const [name, src] of Object.entries(files)) {
		const style = css(src);
		assert.doesNotMatch(style, /\d+m?s\b/, `${name} has a duration literal`);
		assert.doesNotMatch(style, /cubic-bezier/, `${name} has an easing literal`);
		assert.doesNotMatch(style, /transition:\s*all/, name);
		assert.doesNotMatch(style, /prefers-reduced-motion/, `${name} keeps a per-component reduce block`);
		assert.doesNotMatch(style, /@keyframes/, `${name} keeps keyframes`);
		assert.doesNotMatch(style, /transition:[^;]*\b(width|height|margin|padding|top|left)\b/, `${name} transitions layout`);
	}
});

test('polish: ladder heights, focus tokens, disabled token, no literal px/rem spacing left', () => {
	assert.ok(hasDecl(css(files.Tabs), '.tab', 'min-height', 'var(--control-md)'));
	assert.ok(hasDecl(css(files.SegmentedControl), '.seg', '--seg-h', 'var(--control-md)'));
	assert.ok(hasDecl(css(files.Badge), '.badge', '--badge-h', 'var(--chip-md)'));
	assert.ok(hasDecl(css(files.Switch), '.switch', '--sw-h', 'var(--chip-md)'));
	assert.ok(hasDecl(css(files.Checkbox), '.box', 'width', 'var(--cb-box, var(--chip-sm))'));
	assert.ok(hasDecl(css(files.Toggle), '.toggle', 'height', 'var(--toggle-size, var(--control-sm))'));
	for (const [name, src] of Object.entries(files)) {
		const style = css(src);
		assert.doesNotMatch(style, /outline: 2px|outline-offset: -?\d+px/, `${name} focus ring literal`);
		assert.doesNotMatch(style, /opacity: 0\.45/, `${name} disabled literal`);
		assert.doesNotMatch(style, /line-height: (0?\.[0-9]+|[1-9][0-9.]*)(rem)?;/, `${name} line-height literal`);
		assert.doesNotMatch(style, /(padding|gap|margin)[^;]*: [^;]*\b0\.(05|1|15|2|3|35|4)rem/, `${name} off-scale spacing`);
		assert.doesNotMatch(style, /border-radius: [1-9]/, `${name} radius literal`);
	}
	for (const sel of ['.tab', '.seg-item', '.tabbar-item', '.open']) {
		const src = sel === '.open' ? files.AttachmentList : sel === '.tabbar-item' ? files.TabBar : sel === '.tab' ? files.Tabs : files.SegmentedControl;
		assert.ok(hasDecl(css(src), `${sel}:focus-visible`, 'outline-offset', 'var(--focus-ring-offset-inset)'), sel);
	}
	assert.doesNotMatch(files.TabBar + files.AttachmentList, /size=\{\d+\}/);
});

test('GlyphStack defaults to tap-to-expand on coarse pointers only', () => {
	assert.match(files.GlyphStack, /const mode = \$derived\(expand !== 'none' \? expand : coarse \? 'tap' : 'none'\)/);
	assert.match(files.GlyphStack, /matchMedia\('\(pointer: coarse\)'\)/);
	assert.ok(hasDecl(css(files.GlyphStack), '.stacked > :global(*)', '--focus-ring-offset', 'var(--focus-ring-offset-inset)'));
});
