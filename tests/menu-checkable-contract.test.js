import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { compile, preprocess } from 'svelte/compiler';
import { menuItemCloses, menuItemGlyphs } from '../src/lib/components/molecules/menu-item';
import { hasDecl, normalize } from './helpers.mjs';

const url = new URL('../src/lib/components/molecules/Menu.svelte', import.meta.url);
const source = await readFile(url, 'utf8');
const { code } = await preprocess(source, vitePreprocess(), { filename: 'Menu.svelte' });
const compiled = compile(code, { generate: 'server', filename: 'Menu.svelte' });
const flat = normalize(source);

test('a checkable item with an icon keeps the icon leading and shows its check trailing', () => {
	assert.deepEqual(menuItemGlyphs({ icon: 'fork', pressed: true }), { leading: 'icon', trailingCheck: true });
	assert.deepEqual(menuItemGlyphs({ icon: 'fork', pressed: false }), { leading: 'icon', trailingCheck: true });
});

test('a checkable item without an icon keeps the leading check slot', () => {
	assert.deepEqual(menuItemGlyphs({ pressed: true }), { leading: 'check', trailingCheck: false });
	assert.deepEqual(menuItemGlyphs({ pressed: false }), { leading: 'check', trailingCheck: false });
});

test('plain items are untouched: icon or nothing, never a check slot', () => {
	assert.deepEqual(menuItemGlyphs({ icon: 'edit' }), { leading: 'icon', trailingCheck: false });
	assert.deepEqual(menuItemGlyphs({}), { leading: 'none', trailingCheck: false });
});

test('the row renders the leading glyph from the helper and a trailing check slot', () => {
	assert.match(flat, /\{@const glyphs = menuItemGlyphs\(item\)\}/);
	assert.match(
		flat,
		/\{#if glyphs\.leading === 'check'\}<span class="menu-check"><Icon name="check" \/><\/span>\{:else if glyphs\.leading === 'icon' && item\.icon\}<Icon name=\{item\.icon\} \/>\{\/if\}/
	);
	assert.match(
		flat,
		/\{#if glyphs\.trailingCheck\}<span class="menu-check menu-check-trailing"><Icon name="check" \/><\/span>\{\/if\}/
	);
});

test('the trailing check sits at the end of the row, after any tag', () => {
	assert.ok(flat.indexOf('class="menu-tag"') < flat.indexOf('menu-check-trailing'));
	assert.ok(hasDecl(source, '.menu-check-trailing', 'margin-inline-start', 'auto'));
	assert.ok(hasDecl(source, '.menu-tag + .menu-check-trailing', 'margin-inline-start', '0'));
});

test('the check glyph is only visible on a pressed row, in both slots', () => {
	assert.ok(hasDecl(source, '.menu-check', 'visibility', 'hidden'));
	assert.ok(hasDecl(source, '.menu-item.on .menu-check', 'visibility', 'visible'));
	assert.ok(hasDecl(source, '.menu-item.on .menu-check', 'color', 'var(--accent)'));
});

test('checkable rows keep role=menuitemcheckbox and aria-checked', () => {
	assert.match(flat, /role=\{item\.pressed === undefined \? 'menuitem' : 'menuitemcheckbox'\}/);
	assert.match(flat, /aria-checked=\{item\.pressed === undefined \? undefined : item\.pressed\}/);
	assert.match(compiled.js.code, /menuitemcheckbox/);
	assert.match(compiled.js.code, /aria-checked/);
});

test('selecting closes the menu by default', () => {
	assert.equal(menuItemCloses({}, true), true);
	assert.equal(menuItemCloses({ pressed: true }, true), true);
});

test('closeOnSelect={false} keeps the menu open for every item', () => {
	assert.equal(menuItemCloses({}, false), false);
	assert.equal(menuItemCloses({ pressed: false }, false), false);
});

test('a per-item keepOpen wins over the menu default in both directions', () => {
	assert.equal(menuItemCloses({ keepOpen: true }, true), false);
	assert.equal(menuItemCloses({ keepOpen: false }, false), true);
});

test('Menu exposes closeOnSelect (default true) and MenuItem exposes keepOpen', () => {
	assert.match(flat, /closeOnSelect = true,/);
	assert.match(flat, /closeOnSelect\?: boolean;/);
	assert.match(flat, /keepOpen\?: boolean;/);
});

test('select() consults the helper before closing and still runs the action', () => {
	assert.match(flat, /if \(menuItemCloses\(item, closeOnSelect\)\) close\(\); item\.onselect\(\);/);
});
