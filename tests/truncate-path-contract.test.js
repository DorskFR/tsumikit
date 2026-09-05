import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { pathCandidates, truncate } from '../src/lib/truncate.ts';

const source = await readFile(new URL('../src/lib/components/molecules/Truncate.svelte', import.meta.url), 'utf8');

test('pathCandidates abbreviates ancestors, drops them, then clips the leaf', () => {
	assert.deepEqual(pathCandidates('/home/dorsk/Documents/cctui', { minLeaf: 3 }), [
		'/home/dorsk/Documents/cctui',
		'/h/dorsk/Documents/cctui',
		'/h/d/Documents/cctui',
		'/h/d/D/cctui',
		'…/d/D/cctui',
		'…/D/cctui',
		'cctui',
		'cct…'
	]);
	assert.deepEqual(pathCandidates('~/src/app', { keepFirst: 1 }).slice(0, 3), ['~/src/app', '~/s/app', '…/s/app']);
});

test("truncate mode 'path' picks the richest candidate within max", () => {
	assert.equal(truncate('/home/dorsk/Documents/cctui', { max: 12, mode: 'path' }), '/h/d/D/cctui');
	assert.equal(truncate('/home/dorsk/Documents/cctui', { max: 7, mode: 'path', minLeaf: 3 }), 'cctui');
	assert.equal(truncate('short', { max: 12, mode: 'path' }), 'short');
});

test('Truncate exposes fit, mono, copyable and grow; max is optional', () => {
	assert.match(source, /max\?: number;/);
	assert.match(source, /fit\?: boolean;/);
	assert.match(source, /mono\?: boolean;/);
	assert.match(source, /copyable\?: boolean;/);
	assert.match(source, /grow\?: boolean;/);
	assert.match(source, /new ResizeObserver\(measure\)/);
	assert.match(source, /candidates\.find\(\(c\) => \[\.\.\.c\]\.length \* chPx <= budget\)/);
	assert.match(source, /copyToClipboard\(text\)/);
});
