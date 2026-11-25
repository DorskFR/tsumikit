import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { readDemo } from './helpers/demo-source.js';

const card = await readFile(new URL('../src/lib/components/atoms/Card.svelte', import.meta.url), 'utf8');
const page = await readDemo();

test('Card accepts a border prop; unset, neutral cards are shade-only and toned cards solid', () => {
	assert.match(card, /border\?: 'solid' \| 'dashed' \| 'none';/);
	assert.match(card, /^\t\tborder,$/m);
	assert.match(card, /const edge = \$derived\(border \?\? \(t === 'neutral' \? 'shade' : 'solid'\)\);/);
});

test('border toggles a border-<style> class; solid adds none', () => {
	assert.match(card, /class:border-dashed=\{edge === 'dashed'\}/);
	assert.match(card, /class:border-none=\{edge === 'none'\}/);
	assert.match(card, /class:border-shade=\{edge === 'shade'\}/);
	assert.doesNotMatch(card, /class:border-solid/);
});

test('a shade-only card keeps its edge box but paints it, its dividers and its stack layers transparent', () => {
	assert.match(card, /\.border-shade,\s*\.border-shade > \.card-head,\s*\.border-shade > \.card-foot\s*{\s*border-color: transparent;/);
	assert.match(card, /\.card-stacked\.border-shade:not\(\.stack-ok, \.stack-warn, \.stack-danger, \.stack-info\)::before,/);
	assert.doesNotMatch(card.match(/\.border-shade,[^}]*}/)?.[0] ?? '', /border-style|border-width/);
});

test('the variants set only border-style so tone keeps owning the colour', () => {
	assert.match(card, /border: var\(--edge-width\) solid var\(--surface-edge\);/);
	assert.match(card, /\.border-dashed\s*{\s*border-style: dashed;/);
	assert.match(card, /\.border-none\s*{\s*border-style: none;/);
	assert.match(card, /\.card-ok\s*{\s*border-color: color-mix\(in srgb, var\(--ok\) \d+%, var\(--surface-edge\)\)/);
	assert.doesNotMatch(card, /--card-border-style/);
});

test('stacked back layers follow the same border style', () => {
	assert.match(card, /\.card-stacked\.border-dashed::before,\s*\.card-stacked\.border-dashed::after\s*{\s*border-style: dashed;/);
	assert.match(card, /\.card-stacked\.border-none::before,\s*\.card-stacked\.border-none::after\s*{\s*border-style: none;/);
});

test('the showcase demos the dashed and borderless variants', () => {
	assert.match(page, /<Card border="dashed"/);
	assert.match(page, /const borders = \['solid', 'dashed', 'none'\] as const;[\s\S]*?<Card \{border\}/);
});
