import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [toolbar, iconButton, menu, index] = await Promise.all([
	read('components/layouts/Toolbar.svelte'),
	read('components/molecules/IconButton.svelte'),
	read('components/molecules/Menu.svelte'),
	read('index.ts')
]);

test('Toolbar: role=toolbar, ResizeObserver collapse, data-overflow children hidden, Menu/Popover overflow', () => {
	assert.match(index, /export { default as Toolbar } from '\.\/components\/layouts\/Toolbar\.svelte';/);
	assert.match(toolbar, /role="toolbar"/);
	assert.match(toolbar, /collapseBelow\?: string;/);
	assert.match(toolbar, /items\?: MenuItem\[\];/);
	assert.match(toolbar, /overflow\?: Snippet;/);
	assert.match(toolbar, /sticky\?: boolean;/);
	assert.match(toolbar, /stickyOffset\?: string;/);
	assert.match(toolbar, /density\?: 'compact' \| 'default';/);
	assert.match(toolbar, /new ResizeObserver\(\(\[entry\]\) => {\s*collapsed = entry\.contentRect\.width < limit;/);
	assert.match(toolbar, /\.collapsed :global\(\[data-overflow\]\)\s*{\s*display: none;/);
	assert.match(toolbar, /<Menu label={overflowLabel} {items} placement="bottom-end" box="sm">/);
	assert.match(toolbar, /\.sticky\s*{[^}]*position: sticky;[^}]*top: var\(--toolbar-top, 0\);/s);
});

test('IconButton showLabel renders the label text; row form is block + left-aligned', () => {
	assert.match(iconButton, /showLabel\?: boolean \| 'row';/);
	assert.match(iconButton, /icon={!inline && !chip && !showLabel}/);
	assert.match(iconButton, /block={showLabel === 'row'}/);
	assert.match(iconButton, /{#if showLabel}<span class="ib-label">{label}<\/span>{\/if}/);
	assert.match(iconButton, /:global\(\.btn\.ib-row\)\s*{\s*justify-content: flex-start;/);
});

test('Menu: pressed items are menuitemcheckbox with a check glyph, content snippet rows, bindable open', () => {
	assert.match(menu, /pressed\?: boolean;/);
	assert.match(menu, /content\?: import\('svelte'\)\.Snippet<\[MenuItem\]>;/);
	assert.match(menu, /open = \$bindable\(false\)/);
	assert.match(menu, /role={item\.pressed === undefined \? 'menuitem' : 'menuitemcheckbox'}/);
	assert.match(menu, /aria-checked={item\.pressed === undefined \? undefined : item\.pressed}/);
	assert.match(menu, /{#if item\.content}\s*{@render item\.content\(item\)}/);
	assert.match(menu, /if \(open && !isOpen\) pop\.showPopover\(\);/);
});
