import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { hasDecl, normalize, rule } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/${p}`, import.meta.url), 'utf8');
const [table, card, callout, glyph, sortable] = await Promise.all(
	[
		'lib/components/organisms/DataTable.svelte',
		'lib/components/atoms/Card.svelte',
		'lib/components/molecules/Callout.svelte',
		'lib/components/molecules/GlyphStack.svelte',
		'demo/molecules/SortableList/01-Overview.svelte'
	].map(read)
);
const style = (/** @type {string} */ src) => src.slice(src.indexOf('<style>'));

test('DataTable: the sort button covers the whole sortable header cell', () => {
	assert.match(normalize(table), /class:dt-sortable=\{col\.sortable && !headerSnippets\[col\.key\]\}/);
	const css = style(table);
	assert.ok(hasDecl(css, 'th.dt-sortable', 'position', 'relative'));
	const after = rule(css, '.dt-sort::after');
	assert.equal(after.content, "''");
	assert.equal(after.position, 'absolute');
	assert.equal(after.inset, '0');
	assert.notEqual(rule(css, '.dt-sort').position, 'relative', 'the overlay resolves against the th, not the button');
});

test('Card tone="accent" gets the same tinted border and wash as the other tones', () => {
	for (const t of ['ok', 'warn', 'danger', 'info', 'accent']) {
		const r = rule(style(card), `.card-${t}`);
		assert.equal(r['border-color'], `color-mix(in srgb, var(--${t}) 55%, var(--surface-edge))`, `.card-${t} border is tinted`);
		assert.equal(r.background, `color-mix(in srgb, var(--${t}) 8%, var(--surface-fill))`, `.card-${t} wash is tinted`);
	}
	assert.doesNotMatch(style(card), /--card-tone/);
	assert.match(callout, /<Card\s+tone=\{t\}/);
});

test('GlyphStack: a labelled Dot folds to its disc, label visually hidden but still read', () => {
	const r = rule(style(glyph), '.stacked :global(.dot-row > :not(.dot))');
	assert.equal(r.position, 'absolute');
	assert.equal(r.width, '1px');
	assert.equal(r.height, '1px');
	assert.equal(r['clip-path'], 'inset(50%)');
	assert.equal(r.display, undefined, 'display:none would drop the label from the accessibility tree');
});

test('GlyphStack: folded cells shrink controls with a minimum box instead of clipping them', () => {
	const css = style(glyph);
	for (const sel of ['.stacked > :global(*)', '.stacked > .cell > :global(*)']) {
		const r = rule(css, sel);
		assert.equal(r['min-width'], '0', sel);
		assert.equal(r['min-height'], '0', sel);
		assert.equal(r['max-width'], '1rem', sel);
		assert.equal(r['max-height'], '1rem', sel);
	}
});

test('SortableList overview: title and service stack under a narrow container', () => {
	assert.match(sortable, /<Card padding="sm" class="cq">/);
	assert.match(normalize(sortable), /@container \(max-width: 30rem\) \{ \.incident \{ flex-direction: column;/);
});
