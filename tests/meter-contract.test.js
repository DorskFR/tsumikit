import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [progress, meter, metric, tooltip, index] = await Promise.all([
	read('components/atoms/Progress.svelte'),
	read('components/molecules/Meter.svelte'),
	read('components/molecules/Metric.svelte'),
	read('components/molecules/Tooltip.svelte'),
	read('index.ts')
]);

test('Progress draws markers and auto-tones by percent thresholds', () => {
	assert.match(progress, /markers\?: { at: number; label\?: string; tone\?: Tone }\[\];/);
	assert.match(progress, /toneAt\?: { warn\?: number; danger\?: number };/);
	assert.match(progress, /if \(toneAt\.danger !== undefined && pct >= toneAt\.danger\) return 'danger';/);
	assert.match(progress, /if \(toneAt\.warn !== undefined && pct >= toneAt\.warn\) return 'warn';/);
	assert.match(progress, /{#each markers as m \(m\.at\)}/);
	assert.match(progress, /\.marker\s*{[^}]*position: absolute;[^}]*width: 2px;/s);
});

test('Meter composes label, Progress, readout, caption and actions; exported', () => {
	assert.match(index, /export { default as Meter } from '\.\/components\/molecules\/Meter\.svelte';/);
	assert.match(meter, /format = \(v: number, m: number\) => `\${Math\.round\(\(v \/ m\) \* 100\)}%`/);
	assert.match(meter, /<Progress {value} {max} label={label} {markers} {toneAt}/);
	assert.match(meter, /caption\?: string \| Snippet;/);
	assert.match(meter, /actions\?: Snippet;/);
});

test('Metric gains size, inline layout and tooltip-backed segments', () => {
	assert.match(metric, /size\?: 'sm' \| 'md';/);
	assert.match(metric, /layout\?: 'card' \| 'inline';/);
	assert.match(metric, /segments\?: MetricSegment\[\];/);
	assert.match(metric, /export type MetricSegment = {/);
	assert.match(metric, /<Tooltip text={seg\.hint}>/);
	assert.match(index, /type MetricSegment,/);
});

test('Tooltip trigger wrapper shows a help cursor unless cursor={false}', () => {
	assert.match(tooltip, /cursor\?: boolean;/);
	assert.match(tooltip, /class:help={cursor}/);
	assert.match(tooltip, /\.tip-wrap\.help:not\(:has\(a, button, input, select, textarea\)\)\s*{\s*cursor: help;/);
});
