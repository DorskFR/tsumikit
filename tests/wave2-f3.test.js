import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';
import { autoresize, borderBlock } from '../src/lib/autoresize.ts';
import { normalize } from './helpers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');

const files = {
	Input: 'components/atoms/Input.svelte',
	Textarea: 'components/atoms/Textarea.svelte',
	Select: 'components/atoms/Select.svelte',
	Combobox: 'components/molecules/Combobox.svelte',
	FilterInput: 'components/molecules/FilterInput.svelte',
	InputGroup: 'components/molecules/InputGroup.svelte',
	Fieldset: 'components/molecules/Fieldset.svelte',
	Field: 'components/molecules/Field.svelte',
	Composer: 'components/molecules/Composer.svelte',
	Dropzone: 'components/molecules/Dropzone.svelte',
	EmojiPicker: 'components/molecules/EmojiPicker.svelte',
	ThemePicker: 'components/molecules/ThemePicker.svelte',
	FontScalePicker: 'components/molecules/FontScalePicker.svelte'
};
/** @type {Record<string, string>} */
const src = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([k, p]) => [k, await read(p)])));
const css = (/** @type {string} */ k) => normalize(src[k].slice(src[k].indexOf('<style>')));

test('no stale literals: durations, easings, disabled opacity, pill radius, focus ring, line-height, icon px', () => {
	for (const [name, s] of Object.entries(src)) {
		const style = s.slice(s.indexOf('<style>'));
		assert.doesNotMatch(style, /\b0\.\d+s\b|\b\d+ms\b/, `${name} hard-codes a duration`);
		assert.doesNotMatch(style, /cubic-bezier|var\(--ease\)/, `${name} hard-codes an easing`);
		assert.doesNotMatch(style, /transition:\s*all/, `${name} transitions all`);
		assert.doesNotMatch(style, /opacity: 0\.(45|6);/, `${name} hard-codes a disabled opacity`);
		assert.doesNotMatch(style, /border-radius: (999|[1-9]\d*px|50%)/, `${name} hard-codes a radius`);
		assert.doesNotMatch(style, /outline: 2px|outline-offset: -?\d+px/, `${name} bypasses the focus-ring tokens`);
		assert.doesNotMatch(style, /line-height: [0-9.]+(rem)?;/, `${name} hard-codes a line-height`);
		assert.doesNotMatch(style, /prefers-reduced-motion/, `${name} keeps a per-component reduced-motion block`);
		assert.doesNotMatch(s, /size=\{\d+\}|size=\{small \? \d+ : \d+\}/, `${name} passes a pixel icon size`);
	}
});

test('every :hover rule sits under @media (hover: hover) and (pointer: fine)', () => {
	for (const [name, s] of Object.entries(src)) {
		const style = s.slice(s.indexOf('<style>'));
		const gated = [...style.matchAll(/@media \(hover: hover\) and \(pointer: fine\) \{([\s\S]*?)\n\t\}/g)].map((m) => m[1]).join('\n');
		const total = (style.match(/:hover/g) ?? []).length;
		const inside = (gated.match(/:hover/g) ?? []).length;
		assert.equal(total, inside, `${name}: ${total - inside} ungated :hover rule(s)`);
	}
});

test('fields read the per-tier control tokens and keep the 16px coarse-pointer floor', () => {
	for (const k of ['Input', 'Textarea', 'Select']) {
		const c = css(k);
		assert.match(c, /font-size: var\(--control-fs-md\)/, k);
		assert.match(c, /font-size: var\(--control-fs-sm\)/, k);
		assert.match(c, /font-size: var\(--control-fs-lg\)/, k);
		assert.match(c, /var\(--control-px-md\)/, k);
		assert.match(c, /@media \(pointer: coarse\) \{[^@]*max\(16px, var\(--control-fs-md\)\)/, k);
		assert.match(c, /transition: border-color var\(--dur-fast\) ease/, k);
	}
	assert.match(css('Textarea'), /min-height: var\(--textarea-size, var\(--control-height-default\)\)/);
	assert.match(css('Textarea'), /\.textarea-sm \{[^}]*min-height: var\(--textarea-size, var\(--control-height-compact\)\)/);
	assert.doesNotMatch(css('Textarea'), /2\.5rem\)|2rem\)/);
	assert.match(css('FilterInput'), /\.fi__input \{[^}]*font-size: var\(--control-fs-md\)/);
	assert.match(css('InputGroup'), /--ig-pad-x: var\(--control-px-md\)/);
});

test('disabled fields dim through --disabled-opacity on the wrap, not twice', () => {
	assert.match(css('Input'), /\.input:disabled \{ opacity: var\(--disabled-opacity\); cursor: not-allowed; \}/);
	assert.match(css('Input'), /\.input-wrap:has\(\.input:disabled\) \{ opacity: var\(--disabled-opacity\); \}/);
	assert.match(css('Input'), /\.input-wrap \.input:disabled \{ opacity: 1; \}/);
	assert.match(css('Input'), /\.input\.grouped:disabled \{ opacity: 1; \}/);
	assert.match(css('Select'), /\.select-wrap:has\(\.select:disabled\) \{ opacity: var\(--disabled-opacity\); \}/);
	assert.match(css('Textarea'), /\.textarea-wrap:has\(\.textarea:disabled\):not\(\.grouped\) \{ opacity: var\(--disabled-opacity\); \}/);
	for (const k of ['InputGroup', 'Fieldset', 'Dropzone']) assert.match(css(k), /opacity: var\(--disabled-opacity\); cursor: not-allowed;/, k);
});

test('clear buttons and picker cells press with --press-scale-sm over --dur-press and fade in', () => {
	for (const [k, sel] of [['Input', '.input-clear'], ['FilterInput', '.fi__clear']]) {
		assert.match(css(k), new RegExp(`${sel.replace('.', '\\.')}:active \\{ --clear-scale-dur: var\\(--dur-press\\); scale: var\\(--press-scale-sm\\); \\}`), k);
		assert.match(css(k), new RegExp(`@starting-style \\{ ${sel.replace('.', '\\.')} \\{ opacity: 0; \\} \\}`), k);
	}
	assert.match(css('EmojiPicker'), /\.tab:active, \.cell:active \{ --cell-scale-dur: var\(--dur-press\); scale: var\(--press-scale-sm\); \}/);
	assert.match(css('ThemePicker'), /\.cell:active \{ --cell-scale-dur: var\(--dur-press\); scale: var\(--press-scale-sm\); \}/);
	assert.match(css('FontScalePicker'), /\.end:active \{ --end-scale-dur: var\(--dur-press\); scale: var\(--press-scale-sm\); \}/);
});

test('listboxes enter with opacity + scale from the trigger side over --dur-fast; highlight is instant in, fast out', () => {
	const cb = css('Combobox');
	assert.match(cb, /transform-origin: var\(--tsu-origin, top left\)/);
	assert.match(cb, /@starting-style \{ \.cb-panel:popover-open \{ opacity: 0; scale: var\(--enter-scale\); translate: var\(--tsu-shift, 0 calc\(-1 \* var\(--shift-sm\)\)\); \} \}/);
	assert.match(cb, /\.cb-option\.active \{[^}]*transition-duration: var\(--dur-instant\)/);
	assert.match(css('FilterInput'), /@starting-style \{ \.fi__menu \{ opacity: 0; scale: var\(--enter-scale\)/);
	assert.match(css('FilterInput'), /\.fi__opt\.is-active \{[^}]*transition-duration: var\(--dur-instant\)/);
	assert.match(css('Dropzone'), /@starting-style \{ \.dz-overlay \{ opacity: 0; \} \}/);
	for (const k of ['Combobox', 'FilterInput']) assert.doesNotMatch(css(k), /transition:[^;]*(width|height|margin|padding|top|left)\b/, k);
});

test('icons follow the tier: Select chevron/face and Input adornments read --control-icon-*', () => {
	const sel = css('Select');
	assert.match(sel, /\.select-wrap \{ --select-icon: var\(--control-icon-md\)/);
	assert.match(sel, /\.select-wrap:has\(\.select\.compact\) \{ --select-icon: var\(--control-icon-sm\); \}/);
	assert.match(sel, /\.select-chevron \{[^}]*font-size: var\(--select-icon\)/);
	assert.match(css('Input'), /\.input-wrap:has\(\.input-sm\) \{ --input-icon: var\(--control-icon-sm\); \}/);
	assert.match(css('FilterInput'), /\.fi--sm \.fi__bar \{[^}]*--fi-icon: var\(--control-icon-sm\)/);
	assert.match(css('Dropzone'), /font-size: var\(--icon-xl\)/);
});

test('autoresize adds the vertical borders under border-box so scrollHeight === clientHeight afterwards', () => {
	const cs = { boxSizing: 'border-box', fontSize: '16px', lineHeight: '20px', paddingTop: '8px', paddingBottom: '8px', borderTopWidth: '1px', borderBottomWidth: '1px' };
	// @ts-expect-error minimal stub
	globalThis.getComputedStyle = () => cs;
	/** @type {any} */
	const node = { rows: 1, scrollHeight: 54, style: { height: '', minHeight: '' }, clientWidth: 100, addEventListener() {}, removeEventListener() {} };
	assert.equal(borderBlock(node), 2);
	const action = autoresize(node, '');
	assert.equal(node.style.height, '56px');
	cs.boxSizing = 'content-box';
	action.update();
	assert.equal(node.style.height, '54px');
	action.destroy();
});

// --- sound hooks (Combobox list, EmojiPicker) with a stubbed $lib/sound ---
const STUB_SOUND = {
	name: 'stub-sound',
	setup(/** @type {import('esbuild').PluginBuild} */ b) {
		b.onResolve({ filter: /(^|[\\/])sound$/ }, (a) => (a.importer.includes('/stores/') ? undefined : { path: 'stub-sound', namespace: 'stub' }));
		b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
			contents: `export function playSound(name, allow = true) { globalThis.__played.push([name, allow]); }`,
			loader: 'js'
		}));
	}
};
const bundle = (
	await esbuild.build({
		entryPoints: [join(HERE, 'fixtures/mount-wave2-f3.js')],
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

/** @param {Record<string, unknown>} props */
function render(props) {
	const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const win = /** @type {any} */ (dom.window);
	win.__played = [];
	win.HTMLElement.prototype.showPopover ??= function () { this.setAttribute('data-open', ''); };
	win.HTMLElement.prototype.hidePopover ??= function () { this.removeAttribute('data-open'); };
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	mount(Fixture, { target: win.document.body, props });
	flushSync();
	return { win, doc: win.document, flush: flushSync, played: () => win.__played.map((/** @type {any[]} */ p) => p.join(':')) };
}

test('Combobox plays open/close once per transition, nothing on mount, silenced by sound={false}', () => {
	const ui = render({ which: 'combobox' });
	assert.deepEqual(ui.played(), []);
	ui.win.__f3.setOpen(true);
	ui.flush();
	assert.deepEqual(ui.played(), ['open:true']);
	ui.win.__f3.setOpen(false);
	ui.flush();
	assert.deepEqual(ui.played(), ['open:true', 'close:true']);

	const pre = render({ which: 'combobox', open: true });
	assert.deepEqual(pre.played(), [], 'an already-open list on mount is a sync, not a transition');

	const quiet = render({ which: 'combobox', sound: false });
	quiet.win.__f3.setOpen(true);
	quiet.flush();
	assert.deepEqual(quiet.played(), ['open:false']);
});

test('EmojiPicker: optional sound prop (default true), open/close hooked on the Popover callbacks and forwarded to it', () => {
	assert.match(src.EmojiPicker, /sound\?: boolean;/);
	assert.match(src.EmojiPicker, /sound = true,/);
	assert.match(src.EmojiPicker, /\{sound\}\n\tonopen=\{\(\) => \{[^}]*playSound\('open', sound\);/);
	assert.match(src.EmojiPicker, /onclose=\{\(\) => playSound\('close', sound\)\}/);
	assert.doesNotMatch(src.EmojiPicker, /sound-synth/);
	const ui = render({ which: 'emoji' });
	assert.deepEqual(ui.played(), [], 'nothing plays on mount');
});
