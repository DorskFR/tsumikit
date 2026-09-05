import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/molecules/Pagination.svelte', import.meta.url),
	'utf8'
);
const index = await readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8');

test('Pagination prop surface and defaults', () => {
	assert.match(source, /page = \$bindable\(1\)/);
	assert.match(source, /pageCount\?: number;/);
	assert.match(source, /offset = \$bindable\(\)/);
	assert.match(source, /limit\?: number;/);
	assert.match(source, /total\?: number;/);
	assert.match(source, /onchange\?: \(page: number\) => void;/);
	assert.match(source, /siblings = 1/);
	assert.match(source, /showEdges = true/);
	assert.match(source, /showRange = false/);
	assert.match(source, /size = 'md'/);
	assert.match(source, /size\?: ControlSize;/);
	assert.match(source, /label = 'Pagination'/);
});

test('Pagination derives page/pageCount in offset mode and writes offset back', () => {
	assert.match(source, /const offsetMode = \$derived\(offset !== undefined && limit !== undefined && total !== undefined\);/);
	assert.match(source, /Math\.ceil\(\(total as number\) \/ Math\.max\(1, limit as number\)\)/);
	assert.match(source, /Math\.floor\(\(offset as number\) \/ Math\.max\(1, limit as number\)\) \+ 1/);
	assert.match(source, /if \(offsetMode\) offset = \(next - 1\) \* \(limit as number\);/);
	assert.match(source, /onchange\?\.\(next\);/);
	assert.match(source, /`\${from}–\${to} \/ \${t}`/);
});

test('Pagination is an accessible nav with chevron IconButtons, aria-current pages and an ellipsis', () => {
	assert.match(source, /<nav\s+data-tsu="Pagination"[^>]*aria-label={label}/s);
	assert.match(source, /icon="chevron-left"\s+label="Previous page"/s);
	assert.match(source, /icon="chevron-right"\s+label="Next page"/s);
	assert.match(source, /disabled={current <= 1}/);
	assert.match(source, /disabled={current >= count}/);
	assert.match(source, /aria-current={item === current \? 'page' : undefined}/);
	assert.match(source, /<span class="ellipsis" aria-hidden="true">…<\/span>/);
	assert.match(source, /if \(showEdges && lo > 1\) {\s*out\.push\(1\);/s);
});

test('Pagination collapses to prev / "n / count" / next under 24rem of container width', () => {
	assert.match(source, /container-type: inline-size;/);
	assert.match(source, /@container \(max-width: 24rem\)\s*{\s*\.pages\s*{\s*display: none;\s*}\s*\.pagination :global\(\.compact\)\s*{\s*display: inline;/s);
	assert.match(source, /<Text class="compact"[^>]*>{current} \/ {count}<\/Text>/);
});

test('Pagination is exported', () => {
	assert.match(index, /export { default as Pagination } from '\.\/components\/molecules\/Pagination\.svelte';/);
});
