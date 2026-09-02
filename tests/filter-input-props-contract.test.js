import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [input, bar] = await Promise.all([
	readFile(new URL('../src/lib/components/molecules/FilterInput.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/components/organisms/FilterSearchBar.svelte', import.meta.url), 'utf8')
]);

test('FilterInput gains size, shape, surface, hotkey, showHotkey and grow', () => {
	assert.match(input, /size\?: 'sm' \| 'md'/);
	assert.match(input, /shape\?: 'square' \| 'pill'/);
	assert.match(input, /surface\?: 'base' \| 'raised' \| 'sunken'/);
	assert.match(input, /hotkey\?: string/);
	assert.match(input, /showHotkey\?: boolean/);
	assert.match(input, /grow\?: boolean/);
	assert.match(input, /size = 'md'/);
	assert.match(input, /shape = 'square'/);
	assert.match(input, /surface = 'base'/);
	assert.match(input, /showHotkey = false/);
});

test('bar heights come from the control tokens, not a literal 44px', () => {
	assert.doesNotMatch(input, /44px/);
	assert.match(input, /\.fi__bar\s*{[^}]*min-height: var\(--control-height-default\);/s);
	assert.match(input, /\.fi--sm \.fi__bar\s*{\s*min-height: var\(--control-height-compact\);/);
	assert.match(input, /\.fi--sm \.fi__input\s*{\s*font-size: var\(--fs-sm\);/);
	assert.match(input, /\.fi--pill \.fi__bar\s*{[^}]*border-radius: var\(--r-pill\);/s);
	assert.match(input, /\.surface-raised \.fi__bar\s*{\s*background: var\(--surface\);/);
	assert.match(input, /\.surface-sunken \.fi__bar\s*{\s*background: var\(--bg-elevated-2\);/);
	assert.match(input, /\.fi--grow\s*{\s*flex: 1 1 0;\s*min-width: 0;/);
	assert.match(input, /class:fi--sm={size === 'sm'}/);
	assert.match(input, /class:fi--pill={shape === 'pill'}/);
	assert.match(input, /class:fi--grow={grow}/);
});

test('hotkey focuses the input from the document, ignoring editable targets and modifiers', () => {
	assert.match(input, /document\.addEventListener\('keydown', onHotkey\)/);
	assert.match(input, /return \(\) => document\.removeEventListener\('keydown', onHotkey\)/);
	assert.match(input, /if \(e\.key !== key \|\| e\.defaultPrevented\) return;/);
	assert.match(input, /if \(e\.ctrlKey \|\| e\.metaKey \|\| e\.altKey\) return;/);
	assert.match(input, /if \(isEditable\(e\.target\)\) return;/);
	assert.match(input, /target\.isContentEditable/);
	assert.match(input, /\['INPUT', 'TEXTAREA', 'SELECT'\]\.includes\(target\.tagName\)/);
	assert.match(input, /e\.preventDefault\(\);\s*el\?\.focus\(\);/);
});

test('showHotkey renders a kbd hint hidden on focus or when non-empty', () => {
	assert.match(input, /{#if showHotkey && hotkey && !focused && !value}\s*<kbd class="fi__kbd" aria-hidden="true">{hotkey}<\/kbd>/);
	assert.match(input, /focused = true;/);
	assert.match(input, /focused = false;/);
});

test('FilterSearchBar forwards the new props to FilterInput', () => {
	for (const prop of ['size', 'shape', 'surface', 'hotkey', 'showHotkey', 'grow']) {
		assert.match(bar, new RegExp(`${prop}\\?:`));
		assert.match(bar, new RegExp(`\\{${prop}\\}`));
	}
	assert.match(bar, /size = 'md'/);
	assert.match(bar, /shape = 'square'/);
	assert.match(bar, /surface = 'base'/);
});
