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
	['seg-sm', 'var(--control-sm)'],
	['seg-control', 'var(--control-height)'],
	['seg-box', 'var(--control-height-default)']
]);

test('every size pins the group height through --seg-h; wrap unpins it after the pins', () => {
	assert.equal(rule(css, '.seg')['--seg-h'], 'var(--control-md)');
	assert.equal(rule(css, '.seg').height, 'var(--seg-h)');
	for (const [cls, h] of sizes) {
		assert.equal(rule(css, `.${cls}`)['--seg-h'], h, cls);
		assert.ok(css.indexOf('.seg-wrap {') > css.indexOf(`.${cls} {`), `unpin comes after the .${cls} pin`);
	}
	const wrap = rule(css, '.seg-wrap');
	assert.equal(wrap['flex-wrap'], 'wrap');
	assert.equal(wrap.height, 'auto');
	assert.equal(rule(css, '.seg').gap, 'var(--sp-1)', 'gap also spaces wrapped rows');
});

test("wrap keeps each item at one row's height instead of 100%", () => {
	assert.equal(rule(css, '.seg-item').height, '100%');
	const r = rule(css, '.seg-wrap .seg-item');
	assert.equal(r.height, 'auto');
	assert.equal(r['min-height'], 'var(--seg-item-h)');
	assert.equal(rule(css, '.seg')['--seg-item-h'], 'calc(var(--seg-h) - 2 * var(--seg-inset))');
});

test('wrap radius is capped at half a row so a wrapped pill squares its corners', () => {
	assert.equal(rule(css, '.seg-wrap:not(.seg-icon)')['border-radius'], 'calc(var(--seg-h) / 2)');
	assert.equal(rule(css, '.seg')['border-radius'], 'var(--r-pill)');
});

test('icon segments stay concentric with the track', () => {
	assert.equal(rule(css, '.seg')['--seg-inset'], 'calc(var(--sp-0-5) + var(--edge-width))');
	assert.equal(rule(css, '.seg-icon .seg-item,\n\t.seg-icon .seg-thumb')['border-radius'], 'calc(var(--r-md) - var(--seg-inset))');
});
