import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} name */
const component = (name) =>
	readFile(new URL(`../src/lib/components/${name}`, import.meta.url), 'utf8');

const [button, popover, segmented, variables] = await Promise.all([
	component('atoms/Button.svelte'),
	component('molecules/Popover.svelte'),
	component('molecules/SegmentedControl.svelte'),
	readFile(new URL('../src/lib/styles/tokens.css', import.meta.url), 'utf8')
]);

test('Popover exposes Button-compatible trigger chrome on one semantic button', () => {
	for (const prop of ['variant', 'tone', 'size', 'control', 'block', 'disabled']) {
		assert.match(popover, new RegExp(`${prop}\\?:`));
	}
	assert.equal(popover.match(/<button\b/g)?.length, 1);
	assert.match(
		popover,
		/<button[\s\S]*popovertarget={id}[\s\S]*{disabled}[\s\S]*>\s*{@render trigger\(\)}[\s\S]*<\/button>/
	);
	assert.match(popover, /popover="auto"/);
	assert.match(popover, /ontoggle={onToggle}/);
});

test('small Button, Popover and SegmentedControl share the compact outer height', () => {
	assert.match(variables, /--control-height-compact: 2rem;/);
	for (const source of [button, popover, segmented]) {
		assert.match(source, /height: var\(--control-height-compact\);/);
	}
});

test('SegmentedControl retains radiogroup semantics and delegated keyboard navigation', () => {
	assert.match(segmented, /role="radiogroup"/);
	assert.match(segmented, /role="radio"/);
	assert.match(segmented, /aria-checked={selected}/);
	assert.match(segmented, /nextEnabledSegment\(options, i, e\.key\)/);
	assert.match(segmented, /e\.preventDefault\(\);[\s\S]*select\(options\[next\]\.value, true\)/);
});

test('control keeps the danger variant/tone tint (TSU-85)', () => {
	assert.match(button, /\.btn-control\.btn-danger,\s*\.btn-control\.btn-tone-danger\s*{\s*color: var\(--danger\);/);
	assert.match(button, /\.btn-control\.btn-danger:hover:not\(:disabled\),\s*\.btn-control\.btn-tone-danger:hover:not\(:disabled\)\s*{[^}]*border-color: var\(--danger\);/s);
});

test('SegmentedControl box tier adopts --control-height-default', () => {
	assert.match(segmented, /box\?: boolean/);
	assert.match(segmented, /class:seg-box={box}/);
	assert.match(segmented, /\.seg-box\s*{\s*height: var\(--control-height-default\);\s*min-height: var\(--control-height-default\);/);
});
