import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { rule } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [tokens, button, popover, toggle, chips] = await Promise.all(
	[
		'styles/tokens.css',
		'components/atoms/Button.svelte',
		'components/molecules/Popover.svelte',
		'components/molecules/Toggle.svelte',
		'components/molecules/FilterChips.svelte'
	].map(read)
);

function media(/** @type {string} */ src, /** @type {string} */ query) {
	const css = src.slice(src.indexOf('<style>'));
	const head = `@media ${query}`;
	let out = '';
	for (let i = css.indexOf(head); i > -1; i = css.indexOf(head, i + 1)) {
		let depth = 0;
		let j = css.indexOf('{', i);
		const start = j + 1;
		for (; j < css.length; j++) {
			if (css[j] === '{') depth++;
			else if (css[j] === '}' && --depth === 0) break;
		}
		out += `\n${css.slice(start, j)}`;
	}
	return out;
}

const fine = (/** @type {string} */ src) => media(src, '(pointer: fine)');
const HIT = 'min(0px, calc((100% - var(--hit-min)) / 2))';
const hitMin = Number(tokens.match(/--hit-min:\s*(\d+)px/)?.[1]);

const insetAt = (/** @type {number} */ px) => Math.min(0, (px - hitMin) / 2);

test('tokens: --hit-min is 24px with a mouse and the full touch target on coarse pointers', () => {
	assert.equal(hitMin, 24);
	const at = tokens.indexOf('@media (pointer: coarse)');
	const coarse = tokens.slice(tokens.indexOf(':root {', at), tokens.indexOf('}', tokens.indexOf(':root {', at)));
	assert.match(coarse, /--hit-min: var\(--touch-target\);/);
});

test('the --hit-min slab reaches 24px and never shrinks a box already past it', () => {
	for (const box of [12, 14, 16, 20, 24]) assert.equal(box - 2 * insetAt(box), hitMin, `box ${box}px`);
	for (const box of [24, 32, 40]) assert.equal(insetAt(box), 0, `box ${box}px`);
});

for (const [name, src, sel, pseudo] of /** @type {const} */ ([
	['IconButton inline', button, '.btn-icon-inline:not(.hit-compact)', '::after'],
	['Menu / Popover trigger', popover, '.pop-trigger:not(.canonical, .hit-compact)', '::after'],
	['Toggle', toggle, '.toggle', '::before'],
	['FilterChips chip', chips, '.chip', '::before']
])) {
	test(`${name}: fine pointers get a --hit-min slab with no inline-end overflow`, () => {
		const block = fine(src);
		assert.ok(block, 'has a (pointer: fine) block');
		const host = rule(block, sel).position ?? rule(src, sel).position;
		assert.equal(host, 'relative');
		const slab = rule(block, `${sel}${pseudo}`);
		assert.equal(slab.content, "''");
		assert.equal(slab.position, 'absolute');
		assert.equal(slab.inset, undefined, 'a shorthand inset grows the slab past the inline end');
		assert.equal(slab['inset-block'], HIT);
		assert.equal(slab['inset-inline-start'], HIT);
		assert.equal(slab['inset-inline-end'], '0');
		assert.equal(slab['min-height'], undefined, 'the slab never grows the control');
	});
}

test('IconButton inline: the fine slab sheds the hover-effect layers that share ::after', () => {
	const slab = fine(button).match(/\.btn-icon-inline:not\(\.hit-compact\)::after\s*{\s*([^;]+);/);
	assert.equal(slab?.[1], 'all: unset', '`all: unset` must come first so later declarations win');
});

test('coarse pointers keep the 0.83 touch slabs on the same controls', () => {
	assert.match(media(button, '(pointer: coarse)'), /\.btn-icon-inline:not\(\.hit-compact\)::after/);
	assert.match(media(popover, '(pointer: coarse)'), /\.pop-trigger:not\(\.canonical, \.hit-compact\)::after/);
	assert.equal(rule(media(toggle, '(pointer: coarse)'), '.toggle::before')['inset-block'], 'var(--touch-slab)');
	assert.equal(rule(media(chips, '(pointer: coarse)'), '.chip::before')['inset-block'], 'var(--touch-slab)');
});
