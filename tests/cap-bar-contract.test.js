import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { capFromPointer, capKeyStep, capTone, clampCap, snapCap } from '../src/lib/cap-bar.ts';

const [component, index] = await Promise.all([
	readFile(new URL('../src/lib/components/molecules/CapBar.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8')
]);

test('CapBar is exported from the molecules block', () => {
	assert.match(index, /export { default as CapBar } from '\.\/components\/molecules\/CapBar\.svelte'/);
});

test('label | track | readout grid with overridable widths', () => {
	assert.match(component, /labelWidth = '96px'/);
	assert.match(component, /readoutWidth = 'auto'/);
	assert.match(component, /grid-template-columns: var\(--label-w\) 1fr var\(--readout-w\);/);
	assert.match(component, /label\?: string \| Snippet/);
	assert.match(component, /readout\?: string \| Snippet/);
	assert.match(component, /caption\?: Snippet/);
});

test('fill width follows value, tone thresholds default to 75 / cap', () => {
	assert.match(component, /warnAt = 75/);
	assert.match(component, /const tone = \$derived\(capTone\(value, cap, warnAt\)\)/);
	assert.match(component, /\.fill\s*{[^}]*width: var\(--pct\);/);
	assert.match(component, /--fill: var\(--ok\);/);
	assert.match(component, /\.tone-warn\s*{\s*--fill: var\(--warn\);/);
	assert.match(component, /\.tone-danger\s*{\s*--fill: var\(--danger\);/);
});

test('track base up to the cap, subdued bg + border region past it', () => {
	assert.match(component, /--track-h: 6px;/);
	assert.match(component, /\.cap-bar\.size-lg\s*{\s*--track-h: 10px;/);
	assert.match(component, /\.track\s*{[^}]*background: color-mix\(in oklab, var\(--fill\) 26%, var\(--bg\)\);/);
	assert.match(component, /\.track::after\s*{[^}]*inset: 0 0 0 var\(--cap\);[^}]*background: var\(--bg\);[^}]*box-shadow: inset 0 0 0 1px var\(--border\);/);
	assert.match(component, /\.track\s*{[^}]*cursor: ew-resize;/);
});

test('handle: 3x16 bar in --text with a 2px surface ring, role=slider with aria values', () => {
	assert.match(component, /\.handle\s*{[^}]*width: 3px;[^}]*height: 16px;[^}]*background: var\(--text\);[^}]*box-shadow: 0 0 0 2px var\(--surface\);[^}]*cursor: ew-resize;/);
	assert.match(component, /role="slider"/);
	assert.match(component, /aria-valuemin={min}/);
	assert.match(component, /aria-valuemax={max}/);
	assert.match(component, /aria-valuenow={cap}/);
	assert.match(component, /aria-label={ariaLabel}/);
	assert.match(component, /tabindex={readonly \? -1 : 0}/);
});

test('pointer sets the cap live, keyboard steps, oninput vs onchange', () => {
	assert.match(component, /step = 5/);
	assert.match(component, /setPointerCapture\(e\.pointerId\)/);
	assert.match(component, /onpointermove={pointerMove}/);
	assert.match(component, /onkeydown={keyDown}/);
	assert.match(component, /onkeyup={keyUp}/);
	assert.match(component, /function setCap\(next: number\) {\s*if \(next === cap\) return;\s*cap = next;\s*oninput\?\.\(cap\);/);
	assert.match(component, /function commit\(\) {\s*if \(cap === committed\) return;\s*committed = cap;\s*onchange\?\.\(cap\);/);
	assert.match(component, /function pointerUp\(\) {[^}]*commit\(\);/);
	assert.match(component, /if \(readonly \|\| !trackEl \|\| e\.button !== 0\) return;/);
});

test('readout and tooltip defaults', () => {
	assert.match(component, /hint \? `\${value}% · \${hint}` : `\${value}%`/);
	assert.match(component, /tooltip \?\? `cap \${cap}% — drag the bar`/);
	assert.match(component, /title={tip}/);
});

test('clampCap bounds and NaN', () => {
	assert.equal(clampCap(120), 100);
	assert.equal(clampCap(-3), 0);
	assert.equal(clampCap(Number.NaN), 0);
	assert.equal(clampCap(42), 42);
});

test('snapCap snaps to step within bounds', () => {
	assert.equal(snapCap(42), 40);
	assert.equal(snapCap(43), 45);
	assert.equal(snapCap(99), 100);
	assert.equal(snapCap(7, 10), 10);
	assert.equal(snapCap(7, 0), 7);
	assert.equal(snapCap(13, 5, 10, 20), 15);
});

test('capFromPointer maps clientX to a snapped percentage', () => {
	const rect = { left: 100, width: 200 };
	assert.equal(capFromPointer(100, rect), 0);
	assert.equal(capFromPointer(300, rect), 100);
	assert.equal(capFromPointer(186, rect), 45);
	assert.equal(capFromPointer(-50, rect), 0);
	assert.equal(capFromPointer(150, { left: 0, width: 0 }), 0);
});

test('capKeyStep: arrows step, shift multiplies by 5, home/end jump, other keys ignored', () => {
	assert.equal(capKeyStep('ArrowRight', false, 50), 55);
	assert.equal(capKeyStep('ArrowLeft', false, 50), 45);
	assert.equal(capKeyStep('ArrowRight', true, 50), 75);
	assert.equal(capKeyStep('ArrowLeft', true, 50), 25);
	assert.equal(capKeyStep('ArrowRight', true, 90), 100);
	assert.equal(capKeyStep('ArrowLeft', false, 0), 0);
	assert.equal(capKeyStep('Home', false, 50), 0);
	assert.equal(capKeyStep('End', false, 50), 100);
	assert.equal(capKeyStep('ArrowRight', false, 50, 10), 60);
	assert.equal(capKeyStep('a', false, 50), null);
});

test('capTone thresholds', () => {
	assert.equal(capTone(10, 80), 'ok');
	assert.equal(capTone(75, 80), 'warn');
	assert.equal(capTone(80, 80), 'danger');
	assert.equal(capTone(60, 80, 50), 'warn');
});

test('track base tint follows the current tone, not the accent', () => {
	assert.match(component, /\.track\s*{[^}]*background: color-mix\(in oklab, var\(--fill\) 26%, var\(--bg\)\);/s);
	assert.doesNotMatch(component, /var\(--accent\) 26%/);
});
