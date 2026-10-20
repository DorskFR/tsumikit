import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { rule } from './helpers.mjs';

const seg = await readFile(
	new URL('../src/lib/components/molecules/SegmentedControl.svelte', import.meta.url),
	'utf8'
);
const css = seg.slice(seg.indexOf('<style>'));

const sizes = /** @type {const} */ ([
	['seg-sm', 'var(--control-height-compact)'],
	['seg-control', 'var(--control-height)'],
	['seg-box', 'var(--control-height-default)']
]);

test('wrap unpins the group height of every pinned size, after the pins', () => {
	const r = rule(css, '.seg-wrap.seg-sm,\n\t.seg-wrap.seg-control,\n\t.seg-wrap.seg-box');
	assert.equal(r.height, 'auto');
	for (const [cls] of sizes) {
		assert.ok(css.indexOf('.seg-wrap.seg-sm,') > css.indexOf(`.${cls} {`), `unpin comes after the .${cls} pin`);
	}
	assert.equal(rule(css, '.seg').gap, 'var(--sp-1)', 'gap also spaces wrapped rows');
});

for (const [cls, h] of sizes) {
	test(`wrap keeps each ${cls} item at one row's height instead of 100%`, () => {
		const r = rule(css, `.seg-wrap.${cls} .seg-item`);
		assert.equal(r.height, 'auto');
		assert.equal(r['min-height'], `calc(${h} - 8px)`);
		assert.equal(rule(css, `.seg-wrap.${cls}:not(.seg-icon)`)['border-radius'], `calc(${h} / 2)`);
	});
}

test('wrap radius is capped at half a row so a wrapped pill squares its corners', () => {
	assert.equal(rule(css, '.seg-wrap:not(.seg-icon)')['border-radius'], 'calc((0.6rem + 1.3 * var(--fs-sm)) / 2 + 4px)');
	assert.equal(rule(css, '.seg')['border-radius'], 'var(--r-pill)');
});
