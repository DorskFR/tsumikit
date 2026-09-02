import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} name */
const component = (name) =>
	readFile(new URL(`../src/lib/components/${name}`, import.meta.url), 'utf8');

const [button, iconButton, selectButton, popover, copyButton, fileButton, cluster, variables] =
	await Promise.all([
		component('atoms/Button.svelte'),
		component('molecules/IconButton.svelte'),
		component('molecules/SelectButton.svelte'),
		component('molecules/Popover.svelte'),
		component('molecules/CopyButton.svelte'),
		component('molecules/FileButton.svelte'),
		component('layouts/Cluster.svelte'),
		readFile(new URL('../src/lib/styles/tokens.css', import.meta.url), 'utf8')
	]);

const BOX_PROP = /box\?: 'xs' \| 'sm' \| 'md' \| 'lg'/;
const HIT_PROP = /hitArea\?: 'auto' \| 'compact'/;
const HIT_SLAB = /inset: min\(0px, calc\(\(100% - var\(--touch-target\)\) \/ 2\)\);/;

test('box scale tokens derive from the control-height scale', () => {
	assert.match(variables, /--box-xs: 1\.5rem;/);
	assert.match(variables, /--box-sm: var\(--control-height-compact\);/);
	assert.match(variables, /--box-md: 2\.25rem;/);
	assert.match(variables, /--box-lg: var\(--control-height-default\);/);
	assert.match(variables, /--touch-target: 44px;/);
});

test('every icon-ish control exposes the shared box scale and hitArea', () => {
	for (const source of [button, iconButton, selectButton, popover, copyButton, fileButton]) {
		assert.match(source, BOX_PROP);
		assert.match(source, HIT_PROP);
	}
	for (const source of [iconButton, selectButton, copyButton]) {
		assert.match(source, /{box}/);
		assert.match(source, /{hitArea}/);
	}
});

test('Button box/square/chip render square, padding-less, non-flexing boxes', () => {
	assert.match(button, /style:--btn-box={box \? `var\(--box-\${box}\)` : undefined}/);
	assert.match(
		button,
		/\.btn-box\s*{[^}]*width: var\(--btn-box\);[^}]*height: var\(--btn-box\);[^}]*padding: 0;[^}]*flex: none;/s
	);
	assert.match(button, /square\?: boolean/);
	assert.match(button, /\.btn-square\s*{[^}]*width: var\(--control-height-default\);[^}]*padding: 0;/s);
	assert.match(button, /\.btn-square\.btn-control\s*{[^}]*width: var\(--control-height\);/s);
	assert.match(button, /\.btn-chip\s*{[^}]*width: var\(--box-lg\);/s);
	assert.match(button, /\.btn-icon\s*{[^}]*min-width: var\(--box-md\);/s);
});

test('Popover and FileButton own the same box geometry on their native element', () => {
	assert.match(popover, /style:--pop-box={box \? `var\(--box-\${box}\)` : undefined}/);
	assert.match(popover, /\.pop-trigger\.trigger-box\s*{[^}]*width: var\(--pop-box\);[^}]*padding: 0;/s);
	assert.match(popover, /\.pop-trigger\s*{[^}]*min-width: var\(--box-md\);/s);
	assert.match(fileButton, /style:--file-box={box \? `var\(--box-\${box}\)` : undefined}/);
	assert.match(fileButton, /\.file-btn\.box\s*{[^}]*width: var\(--file-box\);[^}]*padding: 0;/s);
	assert.match(fileButton, /const onlyIcon = \$derived\(iconOnly \|\| box !== undefined\)/);
	assert.match(copyButton, /const labelShown = \$derived\(showLabel \?\? box === undefined\)/);
});

test('coarse pointers get a 44px hit slab only inside @media (pointer: coarse)', () => {
	for (const source of [button, popover, fileButton]) {
		const coarse = source.match(/@media \(pointer: coarse\)\s*{([\s\S]*?)\n\t}/);
		assert.ok(coarse, 'has a coarse-pointer block');
		assert.match(coarse[1], HIT_SLAB);
		assert.match(coarse[1], /:not\([^)]*hit-compact\)/);
		assert.doesNotMatch(source.replace(coarse[0], ''), /var\(--touch-target\)/);
	}
	assert.match(button, /class:hit-compact={hitArea === 'compact'}/);
	assert.match(popover, /class:hit-compact={hitArea === 'compact'}/);
	assert.match(fileButton, /class:hit-compact={hitArea === 'compact'}/);
});

test('IconButton glyphSize sizes SVG and text glyphs alike', () => {
	assert.match(iconButton, /glyphSize\?: number \| string/);
	assert.match(iconButton, /const emojiCss = \$derived\(glyphCss \?\? `\${size \* 1\.35}px`\)/);
	assert.match(iconButton, /<span class="emoji" style="font-size: {emojiCss}"/);
	assert.match(iconButton, /<span class="glyph" style="font-size: {glyphCss}"><Icon name={icon} \/><\/span>/);
});

test('Button collapseLabel hides data-label children and names the button from them', () => {
	assert.match(button, /collapseLabel\?: 'never' \| 'mobile' \| 'container'/);
	assert.match(button, /@media \(max-width: 40rem\)\s*{\s*\.btn-collapse-mobile :global\(\[data-label\]\)\s*{\s*display: none;/s);
	assert.match(button, /@container \(max-width: 30rem\)\s*{\s*\.btn-collapse-container :global\(\[data-label\]\)\s*{\s*display: none;/s);
	assert.match(button, /if \(!el \|\| collapseLabel === 'never' \|\| explicitName\) return;/);
	assert.match(button, /el\.setAttribute\('aria-label', text\)/);
});

test('Cluster stackAt is a self-contained container query that stacks children full-width', () => {
	assert.match(cluster, /stackAt\?: 'xs' \| 'sm' \| 'md' \| 'lg'/);
	assert.match(cluster, /\.cluster-stack\s*{\s*container-type: inline-size;/s);
	for (const [tier, width] of [['xs', '18rem'], ['sm', '30rem'], ['md', '40rem'], ['lg', '48rem']]) {
		assert.match(
			cluster,
			new RegExp(`@container \\(max-width: ${width}\\)\\s*{\\s*\\.stack-${tier} > :global\\(\\*\\)\\s*{\\s*flex: 1 1 100%;`, 's')
		);
	}
});
