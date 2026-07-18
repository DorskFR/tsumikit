import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const breadcrumb = await readFile(
	new URL('../src/lib/components/molecules/Breadcrumb.svelte', import.meta.url),
	'utf8'
);
const index = await readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8');

test('Breadcrumb exports its item type shape', () => {
	assert.match(breadcrumb, /export interface BreadcrumbItem/);
	assert.match(breadcrumb, /label: string;/);
	assert.match(breadcrumb, /href\?: string;/);
});

test('Breadcrumb renders a labelled nav landmark', () => {
	assert.match(breadcrumb, /<nav aria-label="breadcrumb"/);
});

test('Breadcrumb marks the current page and links the rest', () => {
	assert.match(breadcrumb, /aria-current="page"/);
	assert.match(breadcrumb, /item\.href && i < shown\.length - 1/);
});

test('Breadcrumb supports a separator snippet, char prop, and icon default', () => {
	assert.match(breadcrumb, /separator\?: Snippet/);
	assert.match(breadcrumb, /char\?: string/);
	assert.match(breadcrumb, /name="chevron-right"/);
});

test('Breadcrumb collapses the middle to an ellipsis past maxItems', () => {
	assert.match(breadcrumb, /maxItems > 0 && items\.length > maxItems/);
	assert.match(breadcrumb, /ellipsis: true/);
});

test('index re-exports Breadcrumb and its item type', () => {
	assert.match(index, /default as Breadcrumb/);
	assert.match(index, /type BreadcrumbItem/);
});
