import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} p */
const component = (p) => readFile(new URL(`../src/lib/components/${p}`, import.meta.url), 'utf8');
const [button, iconButton, toggle, fileButton] = await Promise.all([
	component('atoms/Button.svelte'),
	component('molecules/IconButton.svelte'),
	component('molecules/Toggle.svelte'),
	component('molecules/FileButton.svelte')
]);

test('Button pill rounds to --r-pill', () => {
	assert.match(button, /pill\?: boolean/);
	assert.match(button, /pill = false,/);
	assert.match(button, /class:btn-pill={pill}/);
	assert.match(button, /\.btn-pill\s*{\s*border-radius: var\(--r-pill\);\s*}/);
});

test('Button link variant is boxless, inherits text size and underlines on hover/focus', () => {
	assert.match(button, /variant\?: 'default' \| 'primary' \| 'ghost' \| 'danger' \| 'link'/);
	assert.match(button, /class:btn-link={variant === 'link'}/);
	const rule = button.match(/\.btn-link\s*{([^}]*)}/s);
	assert.ok(rule);
	for (const decl of [
		'min-height: auto;',
		'padding: 0 var(--sp-1);',
		'border: none;',
		'background: none;',
		'box-shadow: none;',
		'font-size: inherit;',
		'line-height: 1;',
		'color: var(--btn-tone, var(--link));'
	]) {
		assert.ok(rule[1].includes(decl), decl);
	}
	assert.match(
		button,
		/\.btn-link:hover:not\(:disabled\),\s*\.btn-link:focus-visible\s*{[^}]*text-decoration: underline;/s
	);
	assert.ok(button.indexOf('.btn-link {') > button.indexOf('.btn-lg {'));
	assert.ok(button.indexOf('.btn-link {') > button.indexOf('.btn-control {'));
});

test('Button shrink defaults true and shrink={false} pins the width', () => {
	assert.match(button, /shrink\?: boolean/);
	assert.match(button, /shrink = true,/);
	assert.match(button, /class:no-shrink={!shrink}/);
	assert.match(button, /\.no-shrink\s*{\s*flex: none;\s*align-self: flex-start;\s*}/);
});

test('IconButton forwards pill and shrink', () => {
	assert.match(iconButton, /pill\?: boolean/);
	assert.match(iconButton, /shrink\?: boolean/);
	assert.match(iconButton, /pill = false,/);
	assert.match(iconButton, /shrink = true,/);
	assert.match(iconButton, /<Button[^>]*\{pill\}[^>]*\{shrink\}/s);
});

test('Toggle size defaults to sm; md, grow and shrink map to classes', () => {
	assert.match(toggle, /size\?: ControlSize/);
	assert.match(toggle, /size = 'sm',/);
	assert.match(toggle, /grow\?: boolean/);
	assert.match(toggle, /shrink\?: boolean/);
	assert.match(toggle, /shrink = true,/);
	assert.match(toggle, /class:md={size === 'md'}/);
	assert.match(toggle, /class:grow\b/);
	assert.match(toggle, /class:no-shrink={!shrink}/);
	assert.match(toggle, /\.toggle\.md\s*{\s*padding: 0\.3rem var\(--sp-2\);\s*font-size: var\(--fs-sm\);\s*}/);
	assert.match(toggle, /\.toggle\.grow\s*{\s*flex: 1 1 0;\s*min-width: 0;\s*}/);
	assert.match(toggle, /\.toggle\.no-shrink\s*{\s*flex: none;\s*}/);
	assert.match(toggle, /\.toggle\.pill\s*{\s*border-radius: var\(--r-pill\);/);
	assert.match(toggle, /\.toggle\.struck\s*{\s*text-decoration: line-through;/);
});

test('FileButton control follows --control-height like Button', () => {
	assert.match(fileButton, /control\?: boolean/);
	assert.match(fileButton, /control = false,/);
	assert.match(fileButton, /class:control\b/);
	assert.match(
		fileButton,
		/\.file-btn\.control\s*{\s*height: var\(--control-height\);\s*min-height: var\(--control-height\);/
	);
	assert.match(button, /\.btn-control\s*{[^}]*height: var\(--control-height\);/s);
});
