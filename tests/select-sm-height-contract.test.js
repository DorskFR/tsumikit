import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { rule } from './helpers.mjs';

const source = await readFile(
	new URL('../src/lib/components/atoms/Select.svelte', import.meta.url),
	'utf8'
);
const css = source.slice(source.indexOf('<style>'));

test('Select size="sm" floors min-height at the compact height so the base min-height cannot win', () => {
	const sm = rule(css, '.select.select-sm');
	assert.equal(sm.height, 'var(--select-size, var(--control-height-compact))');
	assert.equal(sm['min-height'], 'var(--select-size, var(--control-height-compact))');
	assert.equal(rule(css, '.select')['min-height'], 'var(--select-size, var(--control-height-default))');
	assert.ok(css.indexOf('.select.select-sm {') > css.indexOf('.select {'), 'sm rule follows the base rule');
});
