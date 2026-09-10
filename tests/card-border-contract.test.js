import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const card = await readFile(new URL('../src/lib/components/atoms/Card.svelte', import.meta.url), 'utf8');
const page = await readFile(new URL('../src/routes/+page.svelte', import.meta.url), 'utf8');

test('Card accepts a border prop defaulting to solid', () => {
	assert.match(card, /border\?: 'solid' \| 'dashed' \| 'none';/);
	assert.match(card, /border = 'solid',/);
});

test('border toggles a border-<style> class; solid adds none', () => {
	assert.match(card, /class:border-dashed=\{border === 'dashed'\}/);
	assert.match(card, /class:border-none=\{border === 'none'\}/);
	assert.doesNotMatch(card, /class:border-solid/);
});

test('the frame reads its style from a token so tone keeps owning the colour', () => {
	assert.match(card, /--card-border-style: solid;/);
	assert.match(card, /border: 1px var\(--card-border-style\) var\(--border\);/);
	assert.match(card, /\.border-dashed\s*{\s*--card-border-style: dashed;/);
	assert.match(card, /\.border-none\s*{\s*--card-border-style: none;/);
	assert.match(card, /border-color: color-mix\(in srgb, var\(--card-tone\) \d+%, var\(--border\)\)/);
});

test('stacked back layers follow the same border style', () => {
	assert.match(card, /border: 1px var\(--card-border-style\) var\(--stack-border\);/);
});

test('the showcase demos the dashed and borderless variants', () => {
	assert.match(page, /<Card border="dashed"/);
	assert.match(page, /<Card border="none"/);
});
