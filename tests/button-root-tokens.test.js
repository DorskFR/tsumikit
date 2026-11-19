import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { hasDecl } from './helpers.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(`../src/${p}`, import.meta.url), 'utf8');
const FILES = [
	'atoms/Button.svelte',
	'atoms/Icon.svelte',
	'molecules/IconButton.svelte',
	'molecules/SplitButton.svelte',
	'molecules/CopyButton.svelte',
	'molecules/FileButton.svelte'
];
const sources = Object.fromEntries(await Promise.all(FILES.map(async (f) => [f, await read(`lib/components/${f}`)])));
const button = sources['atoms/Button.svelte'];
const icon = sources['atoms/Icon.svelte'];
const fileButton = sources['molecules/FileButton.svelte'];
const variants = await read('demo/atoms/Button/02-Variants.svelte');

test('button components declare no custom property and read no style hook', () => {
	for (const [file, src] of Object.entries(sources)) {
		assert.doesNotMatch(src, /(?:^|[\s;{"])--[a-z][a-z0-9-]*\s*:/m, `${file} declares a custom property`);
		assert.doesNotMatch(src, /style:--/, `${file} sets a custom property inline`);
		assert.doesNotMatch(src, /var\(--[a-z0-9-]+,/, `${file} reads a hook with a fallback`);
	}
});

test('Icon reads no variable: it tracks the font-size around it', () => {
	const style = icon.slice(icon.indexOf('<style>'));
	assert.doesNotMatch(style, /var\(/);
	assert.ok(!hasDecl(style, '.icon', 'font-size'));
	assert.ok(hasDecl(style, '.icon', 'width', '1em'));
	assert.ok(hasDecl(style, '.icon', 'height', '1em'));
});

test('Button and FileButton size their nested icons per tier with a descendant selector', () => {
	assert.ok(hasDecl(button, '.btn :global(.icon)', 'font-size', 'var(--control-icon-md)'));
	assert.ok(hasDecl(button, '.btn-sm :global(.icon)', 'font-size', 'var(--control-icon-sm)'));
	assert.ok(hasDecl(button, '.btn-lg :global(.icon)', 'font-size', 'var(--control-icon-lg)'));
	assert.ok(hasDecl(fileButton, '.file-btn :global(.icon)', 'font-size', 'var(--control-icon-md)'));
	assert.ok(hasDecl(fileButton, '.file-btn.sm :global(.icon)', 'font-size', 'var(--control-icon-sm)'));
	assert.ok(hasDecl(fileButton, '.file-btn.lg :global(.icon)', 'font-size', 'var(--control-icon-lg)'));
});

test('Button size="xl" is one step above lg, from existing tokens', () => {
	assert.match(button, /size\?: ControlSize \| 'xl';/);
	assert.match(button, /class:btn-xl={size === 'xl'}/);
	assert.ok(hasDecl(button, '.btn-xl', 'min-height', 'calc(var(--control-height-large) + var(--sp-2))'));
	assert.ok(hasDecl(button, '.btn-xl', 'padding', 'var(--sp-4) var(--sp-6)'));
	assert.ok(hasDecl(button, '.btn-xl', 'font-size', 'var(--fs-md)'));
	assert.ok(hasDecl(button, '.btn-xl :global(.icon)', 'font-size', 'var(--icon-xl)'));
	assert.ok(hasDecl(button, '.btn-square.btn-xl', 'width', 'calc(var(--control-height-large) + var(--sp-2))'));
	assert.match(variants, /<Button size="xl">/);
});

test('tones and the box scale write real properties per class', () => {
	for (const [cls, token] of [['accent', 'accent'], ['success', 'ok'], ['info', 'info'], ['warn', 'warn'], ['danger', 'danger']]) {
		assert.ok(hasDecl(button, `.btn-tone-${cls}`, 'color', `var(--${token})`));
		assert.ok(hasDecl(button, `.btn-tone-${cls}`, 'border-color', `color-mix(in srgb, var(--${token}) 50%, var(--border))`));
	}
	for (const box of ['xs', 'sm', 'md', 'lg']) {
		assert.match(button, new RegExp(`class:btn-box-${box}={box === '${box}'}`));
		assert.ok(hasDecl(button, `.btn-box-${box}`, 'width', `var(--box-${box})`));
		assert.ok(hasDecl(fileButton, `.file-btn.box-${box}`, 'height', `var(--box-${box})`));
	}
});

test('fill progress is written inline on the bar and the ink layer', () => {
	assert.match(button, /class="btn-fill-bar" style:scale="\{fillProgress\} 1"/);
	assert.match(button, /class="btn-layer btn-layer-ink" style:clip-path="inset\(0 \{\(1 - fillProgress\) \* 100\}% 0 0\)"/);
});
