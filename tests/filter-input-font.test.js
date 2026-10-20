import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { hasDecl, normalize } from './helpers.mjs';

const [input, bar] = await Promise.all([
	readFile(new URL('../src/lib/components/molecules/FilterInput.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/components/organisms/FilterSearchBar.svelte', import.meta.url), 'utf8')
]);
const css = normalize(input.slice(input.indexOf('<style>')));

test('FilterInput exposes font: mono | sans, defaulting to mono', () => {
	assert.match(input, /font\?: 'mono' \| 'sans'/);
	assert.match(input, /font = 'mono'/);
	assert.match(input, /class:fi--sans={font === 'sans'}/);
});

test('sans switches the input (and so its placeholder) to --font-sans after the mono base rule', () => {
	assert.ok(hasDecl(css, '.fi__input', 'font-family', 'var(--font-mono)'));
	assert.ok(hasDecl(css, '.fi--sans .fi__input', 'font-family', 'var(--font-sans)'));
	assert.ok(css.indexOf('.fi--sans .fi__input {') > css.indexOf('.fi__input { flex: 1;'));
	assert.doesNotMatch(css, /::placeholder {[^}]*font-family/);
});

test('sans does not touch the coarse-pointer 16px floor', () => {
	const coarse = css.slice(css.indexOf('@media (pointer: coarse) {'));
	assert.doesNotMatch(coarse.slice(0, coarse.indexOf('} }') + 3), /font-family/);
});

test('FilterSearchBar forwards font and keeps its chip values mono', () => {
	assert.match(bar, /font\?: 'mono' \| 'sans'/);
	assert.match(bar, /font = 'mono'/);
	assert.match(bar, /\{font\}/);
	assert.ok(hasDecl(normalize(bar), '.fsb__chip-val', 'font-family', 'var(--font-mono)'));
});
