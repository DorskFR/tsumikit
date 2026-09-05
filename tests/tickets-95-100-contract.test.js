import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/components/${p}`, import.meta.url), 'utf8');
const [autoGrid, popover, fsp, icon] = await Promise.all([
	read('layouts/AutoGrid.svelte'),
	read('molecules/Popover.svelte'),
	read('molecules/FontScalePicker.svelte'),
	read('atoms/Icon.svelte')
]);

test('AutoGrid with max emits a definite auto-fill template inline (TSU-95)', () => {
	assert.match(autoGrid, /max != null && maxCols == null\s*\? `grid-template-columns: repeat\(auto-fill, minmax\(min\(100%, \${min}\), \${max}\)\)`/);
});

test('Popover bare reset is zero-specificity so triggerClass wins (TSU-96)', () => {
	assert.match(popover, /:where\(\.pop-trigger\.bare\)\s*{[^}]*padding: 0;/s);
	assert.doesNotMatch(popover, /\n\t\.pop-trigger\.bare\s*{/);
});

test('FontScalePicker panel fits the viewport and never scrolls (TSU-97)', () => {
	assert.match(fsp, /\.panel\s*{[^}]*width: min\(15rem, calc\(100vw - var\(--sp-6\)\)\);[^}]*overflow: hidden;/s);
	assert.match(fsp, /\.row > :global\(\.slider\)\s*{\s*flex: 1 1 0;\s*min-width: 0;/);
});

test('pin, pin-off and life-buoy glyphs are registered (TSU-99, TSU-100)', () => {
	for (const name of ['pin', "'pin-off'", "'life-buoy'"]) assert.match(icon, new RegExp(`\\n\\t\\t${name}: '<`));
});

test('bare trigger keeps its text line box; box sizing applies to non-bare only; coarse slab covers bare (TSU-101)', () => {
	assert.match(popover, /\.pop-trigger:not\(\.bare\)\s*{[^}]*min-height: var\(--box-md\);[^}]*padding: var\(--sp-2\);/s);
	assert.doesNotMatch(popover, /\n\t\.pop-trigger\s*{[^}]*min-height/s);
	assert.match(popover, /:where\(\.pop-trigger\.bare\)\s*{[^}]*display: inline;[^}]*line-height: inherit;/s);
	assert.match(popover, /\.pop-trigger:not\(\.canonical, \.hit-compact\)::after/);
});
