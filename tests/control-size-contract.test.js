import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [size, index, input, select, textarea, badge, kbd, progress, selectButton, pagination] = await Promise.all([
	read('size.ts'),
	read('index.ts'),
	read('components/atoms/Input.svelte'),
	read('components/atoms/Select.svelte'),
	read('components/atoms/Textarea.svelte'),
	read('components/atoms/Badge.svelte'),
	read('components/atoms/Kbd.svelte'),
	read('components/atoms/Progress.svelte'),
	read('components/molecules/SelectButton.svelte'),
	read('components/molecules/Pagination.svelte')
]);

test('ControlSize is a single exported sm|md|lg union adopted by control-height components', () => {
	assert.match(size, /export type ControlSize = 'sm' \| 'md' \| 'lg';/);
	assert.match(index, /export type { ControlSize } from '\.\/size';/);
	for (const src of [input, select, textarea, kbd, progress, pagination]) assert.match(src, /size\?: ControlSize;/);
	assert.match(input, /\.input-lg\s*{\s*min-height: var\(--control-height-large\);/);
	assert.match(select, /\.select\.select-lg\s*{\s*min-height: var\(--control-height-large\);/);
	assert.match(textarea, /\.textarea-lg\s*{[^}]*min-height: var\(--control-height-large\);/s);
});

test('deprecated compact booleans lose to an explicit size', () => {
	assert.match(select, /@deprecated use `size="sm"`; `size` wins/);
	assert.match(select, /const small = \$derived\(\(size \?\? \(compact \? 'sm' : 'md'\)\) === 'sm'\)/);
});

test('grow / shrink / block are available uniformly', () => {
	for (const src of [textarea, badge, kbd, progress, selectButton, pagination]) {
		assert.match(src, /grow\?: boolean/);
		assert.match(src, /shrink\?: boolean/);
		assert.match(src, /block\?: boolean/);
		assert.match(src, /class:grow={grow}/);
		assert.match(src, /class:no-shrink={!shrink}/);
		assert.match(src, /class:block={block/);
	}
});
