import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} name */
const component = (name) =>
	readFile(new URL(`../src/lib/components/molecules/${name}`, import.meta.url), 'utf8');
const [menu, header, page] = await Promise.all([
	component('Menu.svelte'),
	component('SectionHeader.svelte'),
	readFile(new URL('../src/routes/+page.svelte', import.meta.url), 'utf8')
]);

test('MenuItem carries a free-form string tag with a Badge tone', () => {
	assert.match(menu, /tag\?: string;/);
	assert.match(menu, /tagTone\?: import\('svelte'\)\.ComponentProps<typeof import\('\$lib\/components\/atoms\/Badge\.svelte'\)\.default>\['tone'\];/);
});

test('Menu accepts a tag snippet receiving the item', () => {
	assert.match(menu, /^\t\ttag,$/m);
	assert.match(menu, /tag\?: Snippet<\[MenuItem\]>;/);
	assert.match(menu, /{#if tag}\s*{@render tag\(item\)}/);
});

test('tagged items render a soft xs Badge after the label, tinted by tagTone', () => {
	assert.match(menu, /import Badge from '\$lib\/components\/atoms\/Badge\.svelte'/);
	assert.match(
		menu,
		/<span>{item\.label}<\/span>\s*{#if item\.tag !== undefined}[\s\S]*?<span class="menu-tag">\s*<Badge size="xs" tone={item\.tagTone \?\? 'neutral'} border={false}>{item\.tag}<\/Badge>\s*<\/span>/
	);
	assert.match(menu, /\.menu-tag\s*{[^}]*margin-inline-start: auto;/s);
	assert.match(menu, /class:danger={item\.danger}/);
	assert.doesNotMatch(menu, /:global/);
});

test('SectionHeader variant="group": lead snippet, count, flexible rule, actions', () => {
	assert.match(header, /variant = 'default',/);
	assert.match(header, /variant\?: 'default' \| 'group';/);
	assert.match(header, /lead\?: Snippet;/);
	assert.match(header, /class:sh-group={variant === 'group'}/);
	assert.match(header, /{#if lead}\s*<span class="sh-lead">{@render lead\(\)}<\/span>/);
	assert.match(header, /<Text tone="faint" weight="normal" numeric class="sh-count">{count}<\/Text>/);
	assert.match(
		header,
		/{#if variant === 'group'}\s*<span class="sh-rule" aria-hidden="true"><\/span>\s*{\/if}\s*{#if actions}/
	);
	assert.match(header, /\.sh-rule\s*{[^}]*flex: 1 1 auto;[^}]*height: 1px;[^}]*background: var\(--border\);/s);
	assert.match(header, /\.sh-group > \.sh-row\s*{[^}]*flex-wrap: nowrap;/s);
});

test('group variant keeps normal heading type (uppercase only via the explicit prop)', () => {
	assert.doesNotMatch(header, /\.sh-group[^{]*{[^}]*text-transform/s);
	assert.doesNotMatch(header, /\.sh-group[^{]*{[^}]*letter-spacing/s);
});

test('demo shows a tagged menu item and a group section header', () => {
	assert.match(page, /tag: 'admin', tagTone: 'info'/);
	assert.match(page, /<SectionHeader variant="group"[^>]*count=\{7\}/);
	assert.match(page, /{#snippet lead\(\)}/);
});
