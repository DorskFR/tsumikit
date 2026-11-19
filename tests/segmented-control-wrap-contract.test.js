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

const inset = '(var(--sp-0-5) + var(--edge-width))';

test('every size pins the group height; wrap unpins it after the pins', () => {
	assert.equal(rule(css, '.seg').height, 'var(--control-md)');
	assert.equal(rule(css, '.seg')['min-height'], 'var(--control-md)');
	for (const [cls, h] of sizes) {
		assert.equal(rule(css, `.${cls}`).height, h, cls);
		assert.equal(rule(css, `.${cls}`)['min-height'], h, cls);
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
	assert.equal(r['min-height'], `calc(var(--control-md) - 2 * ${inset})`);
	for (const [cls, h] of sizes) {
		assert.equal(rule(css, `.seg-wrap.${cls} .seg-item`)['min-height'], `calc(${h} - 2 * ${inset})`, cls);
	}
});

test('wrap radius is capped at half a row so a wrapped pill squares its corners', () => {
	assert.equal(rule(css, '.seg-wrap:not(.seg-icon)')['border-radius'], 'min(var(--r-control), calc(var(--control-md) / 2))');
	for (const [cls, h] of sizes) {
		assert.equal(rule(css, `.seg-wrap.${cls}:not(.seg-icon)`)['border-radius'], `min(var(--r-control), calc(${h} / 2))`, cls);
	}
	assert.equal(rule(css, '.seg')['border-radius'], 'var(--r-control)');
});

test('icon segments stay concentric with the track', () => {
	assert.equal(rule(css, '.seg-icon .seg-item,\n\t.seg-icon .seg-thumb')['border-radius'], `calc(var(--r-md) - ${inset})`);
	assert.doesNotMatch(css, /--seg-|--icon-size/);
});
