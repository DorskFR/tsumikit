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
	assert.match(component, /tone\?: 'accent' \| 'success' \| 'ok' \| 'warn' \| 'danger' \| 'muted'/);
	assert.match(component, /label\?: string/);
});

test('renders proportional segments with native title tooltips', () => {
	assert.match(component, /return stacked \? Math\.max\(0, seg\.value\) : Math\.max\(seg\.max, 1\)/);
	assert.match(component, /style="flex-grow: {grow\(seg\)}"/);
	assert.match(component, /title={seg\.label}/);
	assert.match(component, /role="progressbar"/);
	assert.match(component, /aria-valuemax={totalMax}/);
});

test('tones map to semantic tokens', () => {
	assert.match(component, /\.tone-success,\s*\.tone-ok\s*{\s*--fill: var\(--ok\);/);
	assert.match(component, /\.tone-warn\s*{\s*--fill: var\(--warn\);/);
	assert.match(component, /\.tone-danger\s*{\s*--fill: var\(--danger\);/);
	assert.match(component, /\.tone-muted\s*{\s*--fill: var\(--text-faint\);/);
});

test('defaults keep the segments mode with a 2px gap and progressbar semantics', () => {
	assert.match(component, /mode = 'segments'/);
	assert.match(component, /gap = 2/);
	assert.match(component, /legend = false/);
	assert.match(component, /mode\?: 'segments' \| 'stacked'/);
	assert.match(component, /gap\?: number \| string/);
	assert.match(component, /typeof gap === 'number' \? `\${gap}px` : gap/);
	assert.match(component, /aria-valuemin={0}/);
	assert.match(component, /aria-valuenow={totalValue}/);
});

test('stacked mode: widths follow value, slices fully filled, no gap, zero collapses', () => {
	assert.match(component, /const stacked = \$derived\(mode === 'stacked'\)/);
	assert.match(component, /if \(stacked\) return 100;/);
	assert.match(component, /stacked \? '0' :/);
	assert.match(component, /\.stacked \.segment\s*{[^}]*min-width: 0;/);
	assert.match(component, /\.stacked\s*{[^}]*overflow: hidden;/);
	assert.match(component, /\.stacked \.segment\s*{[^}]*background: transparent;/);
});

test('stacked mode: optional max shows the empty remainder of the track', () => {
	assert.match(component, /max\?: number/);
	assert.match(component, /const remainder = \$derived\(max === undefined \? 0 : Math\.max\(0, max - stackedTotal\)\)/);
	assert.match(component, /{#if remainder > 0}\s*<div class="segment remainder" style="flex-grow: {remainder}"><\/div>/);
});

test('stacked mode is an image labelled from the segments, not a progressbar', () => {
	assert.match(component, /role="img"\s*aria-label={stackedLabel}/);
	assert.match(component, /segments\.map\(\(seg\) => `\${seg\.label \?\? seg\.tone \?\? 'accent'} \${seg\.value}`\)\.join\(', '\)/);
});

test('legend renders non-interactive dot + label + value items or a custom snippet', () => {
	assert.match(component, /legend\?: boolean \| 'inline' \| 'below' \| Snippet<\[ProgressSegment\[\]\]>/);
	assert.match(component, /legend === true \? 'below'/);
	assert.match(component, /{@render legendSnippet\(segments\)}/);
	assert.match(component, /<ul class="legend">/);
	assert.match(component, /<li class="legend-item">/);
	assert.match(component, /<Dot color={TONE_FILL\[seg\.tone \?\? 'accent'\]} \/>/);
	assert.match(component, /<Text variant="caption" weight="medium" numeric>{seg\.value}<\/Text>/);
	assert.doesNotMatch(component, /legend[^]*?<(button|a |Button|Link)/);
	assert.match(component, /export const TONE_FILL/);
	assert.match(component, /ok: 'var\(--ok\)'/);
});

test('without a legend the bar itself stays the root element', () => {
	assert.match(component, /{:else}\s*{@render bar\(klass\)}/);
	assert.match(component, /\.legend-inline \.segmented-progress\s*{[^}]*flex: 1 1 0%;/);
});
