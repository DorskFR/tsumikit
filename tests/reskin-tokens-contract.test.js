import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { hasDecl, normalize } from './helpers.mjs';

const read = (/** @type {string} */ path) => readFile(new URL(`../src/lib/${path}`, import.meta.url), 'utf8');
const style = async (/** @type {string} */ path) => {
	const src = await read(path);
	return src.slice(src.indexOf('<style>'));
};
const css = async (/** @type {string} */ path) => normalize(await style(path));

const tokens = await read('styles/tokens.css');
const [metric, badge, input, button, nav, filter, segmented] = await Promise.all([
	css('components/molecules/Metric.svelte'),
	css('components/atoms/Badge.svelte'),
	css('components/atoms/Input.svelte'),
	css('components/atoms/Button.svelte'),
	css('components/layouts/NavSection.svelte'),
	css('components/molecules/FilterInput.svelte'),
	style('components/molecules/SegmentedControl.svelte')
]);
const codeish = await Promise.all(
	['components/atoms/Kbd.svelte', 'components/molecules/CodeBlock.svelte', 'components/molecules/GitRef.svelte', 'components/molecules/Timestamp.svelte'].map(
		css
	)
);

test('tokens.css declares the reskin tokens with sans defaults', () => {
	assert.match(tokens, /^\s*--font-numeric: var\(--font-sans\);/m);
	assert.match(tokens, /^\s*--font-label: var\(--font-sans\);/m);
	assert.match(tokens, /^\s*--r-control: var\(--r-pill\);/m);
	assert.ok(tokens.indexOf('--font-mono:') < tokens.indexOf('--font-numeric:'));
	assert.ok(tokens.indexOf('--r-pill:') < tokens.indexOf('--r-control:'));
});

test('counts and stat values read --font-numeric', () => {
	assert.ok(hasDecl(metric, '.metric-value', 'font-family', 'var(--font-numeric)'));
	assert.ok(hasDecl(metric, '.metric-segments', 'font-family', 'var(--font-numeric)'));
	assert.ok(hasDecl(badge, '.mono', 'font-family', 'var(--font-numeric)'));
	assert.ok(hasDecl(input, '.mono', 'font-family', 'var(--font-numeric)'));
	assert.ok(hasDecl(filter, '.fi__input', 'font-family', 'var(--font-numeric)'));
	assert.ok(hasDecl(filter, '.fi__opt-code', 'font-family', 'var(--font-numeric)'));
});

test('eyebrow labels and shortcut hints read --font-label', () => {
	assert.ok(hasDecl(metric, '.metric-label', 'font-family', 'var(--font-label)'));
	assert.ok(hasDecl(nav, '.nav-section-label', 'font-family', 'var(--font-label)'));
	assert.ok(hasDecl(button, '.btn-shortcut', 'font-family', 'var(--font-label)'));
});

test('no --font-mono is left on non-code text in the reskinned components', () => {
	for (const src of [metric, badge, input, button, nav]) assert.doesNotMatch(src, /var\(--font-mono\)/);
	assert.ok(hasDecl(filter, '.fi__kbd', 'font-family', 'var(--font-mono)'));
	assert.equal(filter.match(/var\(--font-mono\)/g)?.length, 1);
});

test('code-ish slots keep --font-mono', () => {
	for (const src of codeish) assert.match(src, /var\(--font-mono\)/);
});

test('SegmentedControl and the pill FilterInput bar read --r-control; count badges stay pills', () => {
	assert.ok(hasDecl(segmented, '.seg', 'border-radius', 'var(--r-control)'));
	assert.ok(hasDecl(segmented, '.seg-thumb', 'border-radius', 'var(--r-control)'));
	assert.ok(hasDecl(segmented, '.seg-item', 'border-radius', 'var(--r-control)'));
	assert.match(normalize(segmented), /\.seg-wrap:not\(\.seg-icon\) { border-radius: min\(var\(--r-control\), calc\(var\(--seg-h\) \/ 2\)\); }/);
	assert.ok(hasDecl(segmented, '.seg-count', 'border-radius', 'var(--r-pill)'));
	assert.ok(hasDecl(filter, '.fi--pill .fi__bar', 'border-radius', 'var(--r-control)'));
});
