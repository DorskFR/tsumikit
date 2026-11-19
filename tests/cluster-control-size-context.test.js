import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';

const HERE = dirname(fileURLToPath(import.meta.url));
/** @param {string} p */
const read = (p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const sources = Object.fromEntries(
	await Promise.all(
		[
			'layouts/Cluster',
			'atoms/Button',
			'molecules/Popover',
			'molecules/FileButton',
			'molecules/SegmentedControl',
			'molecules/SplitButton'
		].map(async (n) => [n, await read(`components/${n}.svelte`)])
	)
);

const built = await esbuild.build({
	entryPoints: [join(HERE, 'fixtures/mount-cluster-control-size.js')],
	bundle: true,
	write: false,
	format: 'iife',
	platform: 'browser',
	conditions: ['svelte', 'browser', 'import'],
	define: { 'import.meta.env.DEV': 'false' },
	alias: { $lib: join(HERE, '../src/lib') },
	plugins: [sveltePlugin({ compilerOptions: { css: 'injected' } })]
});
const bundle = built.outputFiles[0].text;

const HEIGHT = {
	sm: 'var(--control-height-compact)',
	md: 'var(--control-height-default)',
	lg: 'var(--control-height-large)'
};
const TIERS = /** @type {const} */ (['sm', 'md', 'lg']);

/** @param {{ size?: 'sm' | 'md' | 'lg', own?: 'sm' | 'md' | 'lg' }} props */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	mount(Fixture, { target: dom.window.document.body, props });
	flushSync();
	const doc = dom.window.document;
	/** @param {string} sel */
	const el = (sel) => {
		const node = doc.querySelector(sel);
		assert.ok(node, `missing ${sel}`);
		return /** @type {HTMLElement} */ (node);
	};
	/** @param {string} sel @param {string} prefix */
	const tier = (sel, prefix) => TIERS.filter((t) => el(sel).classList.contains(`${prefix}-${t}`));
	return {
		el,
		tiers: () => ({
			button: tier('#btn', 'btn-control'),
			square: tier('#square', 'btn-control'),
			popover: tier('[data-tsu="Popover"]', 'trigger-control'),
			file: tier('[data-tsu="FileButton"]', 'control'),
			segmented: tier('[data-tsu="SegmentedControl"]', 'seg-control'),
			splitMain: tier('[data-tsu="SplitButton"] [data-tsu="Button"]', 'btn-control'),
			splitCaret: tier('[data-tsu="SplitButton"] [popovertarget]', 'trigger-control')
		}),
		caretWidth: () => el('.split-caret').style.width
	};
}

/** @param {string[]} expected */
const all = (expected) => ({
	button: expected,
	square: expected,
	popover: expected,
	file: expected,
	segmented: expected,
	splitMain: expected,
	splitCaret: expected
});

test('no component declares or re-scopes --control-height', () => {
	for (const [name, src] of Object.entries(sources)) {
		assert.doesNotMatch(src, /--control-height\s*:/, name);
		assert.doesNotMatch(src, /style:--|setProperty/, name);
	}
	assert.match(sources['layouts/Cluster'], /setControlSizeContext\(/);
});

test('an unsized Cluster leaves controls on the root --control-height', () => {
	const ui = render();
	assert.deepEqual(ui.tiers(), all([]));
	assert.equal(ui.caretWidth(), 'var(--control-height)');
	assert.ok(ui.el('#btn').classList.contains('btn-control'));
});

for (const size of TIERS) {
	test(`Cluster size="${size}" is the default tier of its control descendants`, () => {
		const ui = render({ size });
		assert.deepEqual(ui.tiers(), all([size]));
		assert.equal(ui.caretWidth(), HEIGHT[size]);
		assert.ok(ui.el('#nested').classList.contains(`btn-control-${size}`));
		assert.ok(ui.el('#rescoped').classList.contains('btn-control-lg'));
		assert.equal(ui.el('#rescoped').classList.contains(`btn-control-${size}`), size === 'lg');
		for (const id of ['#plain', '#outside'])
			for (const t of TIERS) assert.ok(!ui.el(id).classList.contains(`btn-control-${t}`), `${id} ${t}`);
	});
}

test('an explicit size prop wins over the Cluster size', () => {
	const ui = render({ size: 'sm', own: 'lg' });
	assert.deepEqual(ui.tiers(), all(['lg']));
	assert.equal(ui.caretWidth(), HEIGHT.lg);
	assert.ok(ui.el('#nested').classList.contains('btn-control-sm'));
});

test('each tier class pins the matching control-height token', () => {
	/** @param {string} src @param {string} selector @param {string} value */
	const pins = (src, selector, value) => {
		const at = src.indexOf(`${selector} {`);
		assert.ok(at >= 0, selector);
		const body = src.slice(at, src.indexOf('}', at));
		assert.ok(body.includes(`height: ${value};`) && body.includes(`min-height: ${value};`), `${selector} -> ${value}`);
	};
	for (const t of TIERS) {
		pins(sources['atoms/Button'], `\t.btn-control-${t}`, HEIGHT[t]);
		pins(sources['molecules/Popover'], `.pop-trigger.trigger-control-${t}`, HEIGHT[t]);
		pins(sources['molecules/FileButton'], `.file-btn.control-${t}`, HEIGHT[t]);
		pins(sources['molecules/SegmentedControl'], `\t.seg-control-${t}`, HEIGHT[t]);
		assert.ok(
			sources['atoms/Button'].includes(`.btn-square.btn-control-${t} {\n\t\twidth: ${HEIGHT[t]};\n\t\tmin-width: ${HEIGHT[t]};`)
		);
	}
});
