import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { rule } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [tokens, button, seg] = await Promise.all(
	['styles/tokens.css', 'components/atoms/Button.svelte', 'components/molecules/SegmentedControl.svelte'].map(read)
);

test('the smallest type token is at least 11px', () => {
	const rem = Number(tokens.match(/--fs-xs:\s*calc\(([\d.]+)rem \* var\(--fs-scale\)\)/)?.[1]);
	assert.ok(rem * 16 >= 11, `--fs-xs is ${rem * 16}px`);
});

test('SegmentedControl count text is on the type scale', () => {
	assert.equal(rule(seg, '.seg-count')['font-size'], 'var(--fs-xs)');
});

test('Button sm/link/inline count text is on the type scale with a smaller pill', () => {
	const r = rule(button, '.btn-sm .btn-count,\n\t.btn-link .btn-count,\n\t.btn-icon-inline .btn-count');
	assert.equal(r['font-size'], 'var(--fs-xs)');
	assert.equal(r['--btn-count-size'], '1rem');
	assert.equal(r.padding, '0 0.2rem');
});
