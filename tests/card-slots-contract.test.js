import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const card = await readFile(new URL('../src/lib/components/atoms/Card.svelte', import.meta.url), 'utf8');

test('Card gains header/footer/actions snippets, title/subtitle sugar and gap', () => {
	assert.match(card, /header\?: Snippet;/);
	assert.match(card, /footer\?: Snippet;/);
	assert.match(card, /actions\?: Snippet;/);
	assert.match(card, /title\?: string;/);
	assert.match(card, /subtitle\?: string;/);
	assert.match(card, /gap\?: string;/);
});

test('default rendering is untouched: no frame classes and children render bare', () => {
	assert.match(card, /const framed = \$derived\(!!\(header \|\| footer \|\| title\)\)/);
	assert.match(card, /class:card-framed={framed}/);
	assert.match(card, /class:card-gap={!framed && gap !== undefined}/);
	assert.match(card, /{:else}\s*{@render children\?\.\(\)}\s*{\/if}\s*<\/svelte:element>/);
	assert.match(card, /\.card\s*{\s*--card-pad: var\(--sp-4\);[^}]*padding: var\(--card-pad\);/s);
	assert.match(card, /\.pad-sm\s*{\s*--card-pad: var\(--sp-2\);\s*padding: var\(--sp-2\);/);
	assert.match(card, /\.pad-lg\s*{\s*--card-pad: var\(--sp-6\);\s*padding: var\(--sp-6\);/);
	assert.match(card, /\.pad-none\s*{\s*--card-pad: 0;\s*padding: 0;/);
});

test('title renders a SectionHeader in the head; header/footer sit outside the padded body behind dividers', () => {
	assert.match(card, /import SectionHeader from '\.\.\/molecules\/SectionHeader\.svelte'/);
	assert.match(card, /{#if title}\s*<div class="card-head">\s*<SectionHeader {title} {subtitle} {actions} level=\{3\} size="md" \/>/);
	assert.match(card, /{:else if header}\s*<div class="card-head">{@render header\(\)}<\/div>/);
	assert.match(card, /<div class="card-body" class:card-gap={gap !== undefined}>{@render children\?\.\(\)}<\/div>/);
	assert.match(card, /{#if footer}\s*<div class="card-foot">{@render footer\(\)}<\/div>/);
	assert.match(card, /\.card-framed\s*{\s*padding: 0;/);
	assert.match(card, /\.card-head,\s*\.card-body,\s*\.card-foot\s*{\s*padding: var\(--card-pad\);/);
	assert.match(card, /\.card-head\s*{\s*border-bottom: 1px solid var\(--border\);/);
	assert.match(card, /\.card-foot\s*{\s*border-top: 1px solid var\(--border\);/);
});

test('gap stacks children as a flex column via --card-gap', () => {
	assert.match(card, /style:--card-gap={gap}/);
	assert.match(card, /\.card-gap\s*{\s*display: flex;\s*flex-direction: column;\s*gap: var\(--card-gap\);/);
});
