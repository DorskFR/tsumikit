import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalize } from './helpers.mjs';

const source = await readFile(
	new URL('../src/lib/components/molecules/FilterInput.svelte', import.meta.url),
	'utf8'
);
const css = normalize(source.slice(source.indexOf('<style>')));
const coarse = css.slice(css.indexOf('@media (pointer: coarse) {'));
const coarseBlock = coarse.slice(0, coarse.indexOf('} }') + 3);

test('FilterInput keeps 16px text on coarse pointers so iOS does not zoom on focus', () => {
	assert.ok(coarse.length > 0, 'a (pointer: coarse) block exists');
	assert.match(coarseBlock, /\.fi__input { font-size: max\(16px, var\(--fs-md\)\); }/);
	assert.match(coarseBlock, /\.fi--sm \.fi__input { font-size: max\(16px, var\(--fs-sm\)\); }/);
});

test('fine pointers keep the compact 13px sm text and the coarse floor comes after both base rules', () => {
	const sm = css.indexOf('.fi--sm .fi__input { font-size: var(--fs-sm); }');
	const base = css.indexOf('.fi__input { flex: 1;');
	const floor = css.indexOf('@media (pointer: coarse) {');
	assert.ok(sm > -1 && base > -1, 'base and sm rules exist');
	assert.ok(floor > sm && floor > base, 'coarse floor wins on source order');
});
