import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [component, index] = await Promise.all([
	readFile(new URL('../src/lib/components/atoms/SegmentedProgress.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8')
]);

test('SegmentedProgress is exported with its segment type', () => {
	assert.match(index, /default as SegmentedProgress/);
	assert.match(index, /type ProgressSegment/);
});

test('segments carry value/max, optional tone and label', () => {
	assert.match(component, /export type ProgressSegment = {/);
	assert.match(component, /value: number/);
	assert.match(component, /max: number/);
	assert.match(component, /tone\?: 'accent' \| 'success' \| 'warn' \| 'danger' \| 'muted'/);
	assert.match(component, /label\?: string/);
});

test('renders proportional segments with native title tooltips', () => {
	assert.match(component, /flex-grow: {Math\.max\(seg\.max, 1\)}/);
	assert.match(component, /title={seg\.label}/);
	assert.match(component, /role="progressbar"/);
	assert.match(component, /aria-valuemax={totalMax}/);
});

test('tones map to semantic tokens', () => {
	assert.match(component, /\.tone-success\s*{\s*--fill: var\(--ok\);/);
	assert.match(component, /\.tone-warn\s*{\s*--fill: var\(--warn\);/);
	assert.match(component, /\.tone-danger\s*{\s*--fill: var\(--danger\);/);
	assert.match(component, /\.tone-muted\s*{\s*--fill: var\(--text-faint\);/);
});
