import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { formatSegmentCount } from '../src/lib/components/molecules/segmented-control-count.js';

test('numeric counts get thousands separators', () => {
	assert.equal(formatSegmentCount(0), '0');
	assert.equal(formatSegmentCount(742), '742');
	assert.equal(formatSegmentCount(11178), '11,178');
	assert.equal(formatSegmentCount(1234567), '1,234,567');
});

test('string counts render verbatim', () => {
	assert.equal(formatSegmentCount('99+'), '99+');
	assert.equal(formatSegmentCount('11 178'), '11 178');
});

test('SegmentedControl renders the badge through the formatter', () => {
	const src = readFileSync('src/lib/components/molecules/SegmentedControl.svelte', 'utf8');
	assert.match(src, /count\?: number \| string;/);
	assert.match(src, /<span class="seg-count">\{formatSegmentCount\(o\.count\)\}<\/span>/);
});
