import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [source, icon] = await Promise.all([
	readFile(new URL('../src/lib/components/molecules/SelectButton.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/components/atoms/Icon.svelte', import.meta.url), 'utf8')
]);

test('SelectButton takes a registry icon or raw SVG, a row variant and an active tint', () => {
	assert.match(source, /icon\?: IconName;/);
	assert.match(source, /iconChildren\?: Snippet;/);
	assert.match(source, /variant\?: 'square' \| 'row';/);
	assert.match(source, /active\?: boolean;/);
	assert.match(source, /class:row={variant === 'row'}/);
	assert.match(source, /class:active/);
	assert.match(source, /{#if variant === 'row'}<span aria-hidden="true" class="sb-label">{label}<\/span>{\/if}/);
	assert.match(source, /\.select-button\.active\s*{\s*color: var\(--accent\);/);
});

test('key-round, layout-grid and palette glyphs are registered', () => {
	for (const name of ["'key-round'", "'layout-grid'", 'palette']) assert.match(icon, new RegExp(`\\n\\t\\t${name}: '<`));
});
