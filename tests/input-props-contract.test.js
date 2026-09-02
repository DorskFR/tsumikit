import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/atoms/Input.svelte', import.meta.url),
	'utf8'
);

test('Input gains icon, clearable, shape, width and onenter', () => {
	assert.match(source, /icon\?: IconName/);
	assert.match(source, /clearable\?: boolean/);
	assert.match(source, /onclear\?: \(\) => void/);
	assert.match(source, /shape\?: 'square' \| 'pill'/);
	assert.match(source, /width\?: string/);
	assert.match(source, /onenter\?: \(value: string\) => void/);
	assert.match(source, /shape = 'square'/);
	assert.match(source, /clearable = false/);
});

test('the bare <input> DOM is unchanged unless icon or clearable is used', () => {
	assert.match(source, /const wrapped = \$derived\(!!icon \|\| clearable\)/);
	assert.match(source, /{#if wrapped}\s*<div\s+class="input-wrap"/);
	assert.match(source, /{:else}\s*{@render control\(\)}\s*{\/if}/);
	assert.match(source, /data-tsu="Input"/);
	assert.match(source, /class:input-grow={grow}/);
});

test('icon is inset, clear button appears only with a value and restores focus', () => {
	assert.match(source, /{#if icon}<span class="input-icon"><Icon name={icon} \/><\/span>{\/if}/);
	assert.match(source, /{#if clearable && value}/);
	assert.match(source, /aria-label={clearLabel} onclick={clear}/);
	assert.match(source, /function clear\(\) {\s*value = '';\s*onclear\?\.\(\);\s*el\?\.focus\(\);/);
	assert.match(source, /\.has-icon\s*{[^}]*padding-inline-start: calc\(var\(--sp-3\) \+ 1em \+ var\(--sp-2\)\);/s);
});

test('width sets a fixed width with flex: none; pill uses the pill radius', () => {
	assert.match(source, /style:width={wrapped \? undefined : width}/);
	assert.match(source, /class:input-fixed={!!width}/);
	assert.match(source, /\.input-fixed\s*{\s*flex: none;/);
	assert.match(source, /\.input-pill\s*{[^}]*border-radius: var\(--r-pill\);/s);
});

test('onenter fires with the value on Enter and still calls a consumer onkeydown', () => {
	assert.match(source, /onkeydown\?\.\(e\);/);
	assert.match(source, /if \(onenter && e\.key === 'Enter' && !e\.defaultPrevented\) onenter\(String\(value \?\? ''\)\)/);
});
