import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} path */
const read = (path) => readFile(new URL(`../src/${path}`, import.meta.url), 'utf8');

const [select, textarea, input, field, kbd, index] = await Promise.all([
	read('lib/components/atoms/Select.svelte'),
	read('lib/components/atoms/Textarea.svelte'),
	read('lib/components/atoms/Input.svelte'),
	read('lib/components/molecules/Field.svelte'),
	read('lib/components/atoms/Kbd.svelte'),
	read('lib/index.ts')
]);

test('Select gains width, grow and an embedded variant', () => {
	assert.match(select, /width\?: 'full' \| 'auto'/);
	assert.match(select, /width = 'full'/);
	assert.match(select, /grow\?: boolean/);
	assert.match(select, /variant\?: 'default' \| 'ghost' \| 'embedded'/);
	assert.match(select, /class:w-auto={width === 'auto'}/);
	assert.match(select, /class:select-grow={grow}/);
	assert.match(select, /class:embedded={variant === 'embedded'}/);
	assert.match(select, /\.select-wrap\.w-auto\s*{[^}]*width: auto;/s);
	assert.match(select, /\.select\.w-auto\s*{\s*width: auto;/);
	assert.match(select, /\.select-wrap\.select-grow\s*{\s*flex: 1 1 0;\s*min-width: 0;/);
	assert.match(
		select,
		/\.select\.embedded\s*{\s*background: var\(--bg-elevated-2\);\s*border: none;\s*border-radius: var\(--r-sm\);/
	);
});

test('embedded Select hides the chevron unless explicitly asked for', () => {
	assert.match(select, /const showChevron = \$derived\(chevron \?\? variant !== 'embedded'\)/);
	assert.match(select, /class:no-chevron={!showChevron}/);
	assert.match(select, /{#if showChevron}/);
});

test('Textarea gains maxHeight, onsubmit and submitOn', () => {
	assert.match(textarea, /maxHeight\?: string/);
	assert.match(textarea, /onsubmit\?: \(value: string\) => void/);
	assert.match(textarea, /submitOn\?: 'enter' \| 'mod-enter' \| 'none'/);
	assert.match(textarea, /submitOn = 'none'/);
	assert.match(textarea, /style:max-height={maxHeight}/);
	assert.match(textarea, /class:capped={!!maxHeight}/);
	assert.match(textarea, /\.textarea\.capped\s*{\s*overflow-y: auto;/);
});

test('Textarea submit branches on Enter vs mod+Enter and composes onkeydown', () => {
	assert.match(textarea, /submitOn === 'none' && onsubmit \? 'mod-enter' : submitOn/);
	assert.match(textarea, /onkeydown\?\.\(e\);/);
	assert.match(textarea, /e\.defaultPrevented/);
	assert.match(textarea, /const mod = e\.ctrlKey \|\| e\.metaKey/);
	assert.match(textarea, /submitMode === 'enter' \? !e\.shiftKey && !mod && !e\.altKey : mod && !e\.shiftKey && !e\.altKey/);
	assert.match(textarea, /e\.preventDefault\(\);\s*onsubmit\(String\(value \?\? ''\)\)/);
	assert.equal(
		(textarea.match(/onkeydown={onsubmit \|\| onkeydown \? handleKeydown : undefined}/g) ?? []).length,
		2
	);
});

test('Input onsubmit aliases onenter and both fire', () => {
	assert.match(input, /onenter\?: \(value: string\) => void/);
	assert.match(input, /onsubmit\?: \(value: string\) => void/);
	assert.match(input, /if \(onenter && e\.key === 'Enter' && !e\.defaultPrevented\) onenter\(String\(value \?\? ''\)\)/);
	assert.match(input, /if \(onsubmit && e\.key === 'Enter' && !e\.defaultPrevented\) onsubmit\(String\(value \?\? ''\)\)/);
	assert.match(input, /onkeydown={onenter \|\| onsubmit \|\| onkeydown \? handleKeydown : undefined}/);
});

test('Field gains inline layout, labelWidth and a snippet hint', () => {
	assert.match(field, /layout\?: 'stack' \| 'inline'/);
	assert.match(field, /layout = 'stack'/);
	assert.match(field, /labelWidth\?: string/);
	assert.match(field, /hint\?: string \| Snippet/);
	assert.match(field, /class:field-inline={layout === 'inline'}/);
	assert.match(field, /<label class="label" for={forId} style:width={labelWidth}>/);
	assert.match(field, /{#if typeof hint === 'function'}{@render hint\(\)}{:else}{hint}{\/if}/);
	assert.match(
		field,
		/\.field-inline\s*{\s*flex-direction: row;\s*align-items: center;\s*gap: var\(--sp-2\);/
	);
	assert.match(field, /\.field-inline \.label\s*{\s*flex: none;/);
	assert.match(field, /\.field-grow\s*{\s*flex: 1 1 0;\s*min-width: 0;/);
});

test('Kbd atom exists, is exported and maps tokens to glyphs', () => {
	assert.match(index, /export { default as Kbd } from '\.\/components\/atoms\/Kbd\.svelte'/);
	assert.match(kbd, /keys: string \| string\[\]/);
	assert.match(kbd, /size\?: 'sm' \| 'md'/);
	assert.match(kbd, /size = 'sm'/);
	assert.match(kbd, /data-tsu="Kbd"/);
	assert.match(kbd, /class="kbd-group/);
	assert.match(kbd, /<kbd class="kbd">/);
	assert.match(kbd, /keys\.split\('\+'\)/);
	assert.match(kbd, /case 'mod':\s*return isMac \? '⌘' : 'Ctrl'/);
	assert.match(kbd, /case 'enter':\s*case 'return':\s*return '↵'/);
	assert.match(kbd, /typeof navigator !== 'undefined' &&/);
	assert.match(kbd, /font-family: var\(--font-mono\)/);
	assert.match(kbd, /border-bottom-width: 2px/);
	assert.match(kbd, /background: var\(--bg-elevated-2\)/);
});
