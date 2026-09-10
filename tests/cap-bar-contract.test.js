import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
	capFromPointer,
	capKeyStep,
	capPercent,
	capTone,
	clampCap,
	isStacked,
	markerPercent,
	resolveCap,
	snapCap
} from '../src/lib/cap-bar.ts';

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
	assert.match(component, /aria-valuenow={cap \?\? max}/);
	assert.match(component, /aria-label={ariaLabel}/);
	assert.match(component, /tabindex={readonly \? -1 : 0}/);
});

test('pointer sets the cap live, keyboard steps, oninput vs onchange', () => {
	assert.match(component, /step = 5/);
	assert.match(component, /setPointerCapture\(e\.pointerId\)/);
	assert.match(component, /onpointermove={pointerMove}/);
	assert.match(component, /onkeydown={keyDown}/);
	assert.match(component, /onkeyup={keyUp}/);
	assert.match(
		component,
		/function setCap\(next: number\) {\s*const resolved = resolveCap\(next, clearAtMax, max\);\s*if \(resolved === cap\) return;\s*cap = resolved;\s*oninput\?\.\(cap\);/
	);
	assert.match(component, /function commit\(\) {\s*if \(cap === committed\) return;\s*committed = cap;\s*onchange\?\.\(cap\);/);
	assert.match(component, /function pointerUp\(\) {[^}]*commit\(\);/);
	assert.match(component, /if \(readonly \|\| !trackEl \|\| e\.button !== 0\) return;/);
});

test('cap bubble reads the live cap while dragging or keyboard-focused', () => {
	assert.match(component, /<div class="bubble" aria-hidden="true">{capText}<\/div>/);
	assert.match(component, /\.bubble\s*{[^}]*left: var\(--cap\);[^}]*pointer-events: none;[^}]*opacity: 0;[^}]*visibility: hidden;/s);
	assert.match(component, /\.dragging \.bubble,\s*\.keying \.bubble\s*{\s*opacity: 1;\s*visibility: visible;/);
	assert.match(component, /class:keying/);
	assert.match(component, /onblur={\(\) => \(keying = false\)}/);
	assert.match(component, /e\.preventDefault\(\);\s*keying = true;\s*setCap\(next\);/);
});

test('readout and tooltip defaults', () => {
	assert.match(component, /hint \? `\${value}% · \${hint}` : `\${value}%`/);
	assert.match(component, /tooltip \?\? `\${capText} — drag the bar`/);
	assert.match(component, /title={tip}/);
});

test('capLabel and capValueText override the built-in English ARIA strings', () => {
	assert.match(component, /capLabel\?: string;/);
	assert.match(component, /capValueText\?: string \| \(\(cap: number \| null\) => string\);/);
	assert.match(component, /const ariaLabel = \$derived\(capLabel \?\? \(typeof label === 'string' \? `\${label} cap` : 'cap'\)\)/);
	assert.match(component, /aria-valuetext={ariaValueText}/);
	assert.match(component, /capValueText === undefined \? capText : typeof capValueText === 'string' \? capValueText : capValueText\(cap\)/);
});

test('marker draws a non-interactive rule described by the slider', () => {
	assert.match(component, /marker\?: number \| null;/);
	assert.match(component, /markerTone\?: 'neutral' \| 'ok' \| 'warn' \| 'danger';/);
	assert.match(component, /<div class="marker marker-{markerTone}" title={markerLabel} aria-hidden="true"><\/div>/);
	assert.match(component, /aria-describedby={markerId}/);
	assert.match(component, /<span class="sr-only" id={markerId}>{markerLabel}<\/span>/);
	assert.match(component, /\.marker\s*{[^}]*left: var\(--marker\);[^}]*pointer-events: none;/s);
	assert.doesNotMatch(component, /class="marker[^"]*"[^>]*tabindex/);
});

test('uncapped state hides the cap boundary and speaks uncappedLabel', () => {
	assert.match(component, /cap\?: number \| null;/);
	assert.match(component, /uncappedLabel = 'no cap'/);
	assert.match(component, /clearAtMax = false/);
	assert.match(component, /const uncapped = \$derived\(cap === null\)/);
	assert.match(component, /const capText = \$derived\(uncapped \? uncappedLabel : `cap \${cap}%`\)/);
	assert.match(component, /aria-valuenow={cap \?\? max}/);
	assert.match(component, /\.uncapped \.track::after\s*{\s*display: none;/);
	assert.match(component, /onchange\?: \(cap: number \| null\) => void/);
});

test('layout stacks on demand or below stackBelow, measured on its own box', () => {
	assert.match(component, /layout\?: 'row' \| 'stacked';/);
	assert.match(component, /stackBelow\?: string;/);
	assert.match(component, /const stacked = \$derived\(isStacked\(layout, width, limit\)\)/);
	assert.match(component, /new ResizeObserver/);
	assert.match(component, /class:stacked/);
	assert.match(component, /\.cap-bar\.stacked\s*{\s*grid-template-columns: 1fr auto;/);
	assert.match(component, /\.cap-bar\.stacked \.track\s*{\s*grid-area: 2 \/ 1 \/ 3 \/ -1;/);
});

test('capPercent maps the cap onto the track, uncapped sits at the far end', () => {
	assert.equal(capPercent(null), 100);
	assert.equal(capPercent(40), 40);
	assert.equal(capPercent(15, 10, 20), 50);
	assert.equal(capPercent(999), 100);
});

test('markerPercent is null when there is nothing to draw', () => {
	assert.equal(markerPercent(undefined), null);
	assert.equal(markerPercent(null), null);
	assert.equal(markerPercent(Number.NaN), null);
	assert.equal(markerPercent(30), 30);
	assert.equal(markerPercent(15, 10, 20), 50);
	assert.equal(markerPercent(-5), 0);
});

test('resolveCap clears to null at max only with clearAtMax', () => {
	assert.equal(resolveCap(100), 100);
	assert.equal(resolveCap(100, true), null);
	assert.equal(resolveCap(95, true), 95);
	assert.equal(resolveCap(20, true, 20), null);
});

test('isStacked honours the explicit layout then the width threshold', () => {
	assert.equal(isStacked('stacked'), true);
	assert.equal(isStacked('row'), false);
	assert.equal(isStacked('row', 200, 300), true);
	assert.equal(isStacked('row', 400, 300), false);
	assert.equal(isStacked('row', 0, 300), false);
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
	assert.equal(capTone(99, null), 'warn');
	assert.equal(capTone(10, null), 'ok');
});

test('track base tint follows the current tone, not the accent', () => {
	assert.match(component, /\.track\s*{[^}]*background: color-mix\(in oklab, var\(--fill\) 26%, var\(--bg\)\);/s);
	assert.doesNotMatch(component, /var\(--accent\) 26%/);
});

test('readout clips at readoutWidth with an ellipsis and exposes the full text as a title', () => {
	assert.match(component, /\.readout\s*{[^}]*min-width: 0;[^}]*overflow: hidden;[^}]*text-overflow: ellipsis;/s);
	assert.match(component, /<div class="readout" title={readoutTitle}>/);
});
