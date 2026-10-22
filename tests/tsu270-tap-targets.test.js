import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} p */
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const tokens = await read('src/lib/styles/tokens.css');
const swatch = await read('src/lib/components/atoms/Swatch.svelte');
const carousel = await read('src/lib/components/molecules/Carousel.svelte');
const split = await read('src/lib/components/molecules/SplitButton.svelte');
const demo = await read('src/demo/foundations/Theming/03-Programmatic.svelte');

/** @param {string} v @returns {number} */
const px = (v) => {
	const m = /^(-?[\d.]+)(px|rem)$/.exec(v.trim());
	assert.ok(m, `not a length: ${v}`);
	return m[2] === 'rem' ? Number(m[1]) * 16 : Number(m[1]);
};
/**
 * @param {RegExp} re
 * @param {string} s
 * @returns {string}
 */
const must = (re, s) => {
	const m = re.exec(s);
	assert.ok(m, `no match for ${re}`);
	return m[1];
};
/** @param {string} name @returns {number} */
const token = (name) => {
	const v = must(new RegExp(`--${name}:\\s*([^;]+);`), tokens).trim();
	return /^var\(--([\w-]+)\)$/.test(v) ? token(must(/^var\(--([\w-]+)\)$/, v)) : px(v);
};
/** @param {string} v */
const len = (v) => (/^var\(--([\w-]+)\)$/.test(v.trim()) ? token(must(/^var\(--([\w-]+)\)$/, v.trim())) : px(v));
/** @param {number} size */
const touchSlab = (size) => Math.min(-8, (size - token('touch-target-compact')) / 2);

test('Theming programmatic swatches: no neighbour slab reaches a swatch and each owns >= 24px', () => {
	const sizeProp = /<Swatch\b[^>]*\bsize="(\w+)"/.exec(demo)?.[1] ?? 'md';
	/** @type {Record<string, RegExp>} */
	const sizeVars = { md: /\.swatch\s*\{[^}]*--swatch-size:\s*([^;]+);/, sm: /\.sm\s*\{\s*--swatch-size:\s*([^;]+);/, lg: /\.lg\s*\{\s*--swatch-size:\s*([^;]+);/ };
	const size = len(must(sizeVars[sizeProp], swatch));
	assert.match(swatch, /inset-block: var\(--touch-slab\);\s*inset-inline-start: var\(--touch-slab\);\s*inset-inline-end: 0;/);
	const gap = len(must(/<Cluster gap="([^"]+)">\s*\{#each theme\.all/, demo));
	const slab = -touchSlab(size);
	assert.ok(gap >= slab, `gap ${gap}px < slab ${slab}px: the next swatch's slab covers this one`);
	assert.ok(size + slab >= 24, `owned ${size + slab}px across each axis (Cluster gap is both row and column)`);
});

test('Carousel dots: centred 24px slabs at a pitch of at least 24px on coarse pointers', () => {
	const coarse = carousel.slice(carousel.indexOf('@media (pointer: coarse)'));
	const dot = len(must(/\.dot\s*\{[^}]*width:\s*([^;]+);/, carousel));
	const gap = len(must(/\.dots\s*\{\s*gap:\s*([^;]+);/, coarse));
	const slab = len(must(/inset: calc\(\(100% - (var\(--[\w-]+\))\) \/ 2\)/, coarse));
	assert.ok(slab >= 24, `slab ${slab}px`);
	assert.ok(dot + gap >= slab, `pitch ${dot + gap}px < slab ${slab}px`);
});

test('SplitButton half caret keeps a >= 24px hit box on coarse pointers', () => {
	const coarse = /@media \(pointer: coarse\)\s*\{\s*\.split-half \.split-caret\s*\{\s*min-width:\s*([^;]+);/.exec(split);
	assert.ok(coarse, 'coarse min-width rule');
	assert.ok(len(coarse[1]) >= 24);
});
