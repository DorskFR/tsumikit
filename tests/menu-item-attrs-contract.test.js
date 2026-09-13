import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { compile, preprocess } from 'svelte/compiler';
import { normalize } from './helpers.mjs';

const url = new URL('../src/lib/components/molecules/Menu.svelte', import.meta.url);
const source = await readFile(url, 'utf8');
const { code } = await preprocess(source, vitePreprocess(), { filename: 'Menu.svelte' });
const compiled = compile(code, { generate: 'server', filename: 'Menu.svelte' });

test('MenuItem declares an attrs passthrough typed as button attributes', () => {
	assert.match(
		normalize(source),
		/attrs\?: import\('svelte\/elements'\)\.HTMLButtonAttributes;/
	);
});

test('the rendered row spreads item.attrs', () => {
	assert.match(normalize(source), /<button type="button" \{\.\.\.item\.attrs\}/);
});

test('a data-* attribute reaches the compiled row', () => {
	assert.match(compiled.js.code, /\.\.\.item\.attrs/);
});

test("the row's own semantics are applied after the spread, so attrs cannot break the menu", () => {
	const attrs = compiled.js.code.slice(compiled.js.code.indexOf('...item.attrs'));
	for (const key of ['role', 'aria-checked', 'class', 'disabled', 'tabindex']) {
		assert.match(attrs, new RegExp(`["']?${key}["']?:`), `${key} is not applied after the spread`);
	}
});

test('items without attrs are unchanged: the spread is the only addition', () => {
	assert.match(normalize(source), /class:danger=\{item\.danger\}/);
	assert.match(normalize(source), /disabled=\{item\.disabled\}/);
	assert.match(normalize(source), /onclick=\{\(\) => select\(item, close\)\}/);
});
