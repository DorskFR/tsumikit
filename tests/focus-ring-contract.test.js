import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} p */
const read = (p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [tokens, input, select, textarea, sw, checkbox, slider, filterInput] = await Promise.all([
	read('styles/tokens.css'),
	read('components/atoms/Input.svelte'),
	read('components/atoms/Select.svelte'),
	read('components/atoms/Textarea.svelte'),
	read('components/atoms/Switch.svelte'),
	read('components/atoms/Checkbox.svelte'),
	read('components/atoms/Slider.svelte'),
	read('components/molecules/FilterInput.svelte')
]);

test('a single --focus-ring token drives every form atom focus-visible outline', () => {
	assert.match(tokens, /--focus-ring: 2px solid var\(--accent\);/);
	assert.match(tokens, /--focus-ring-offset: 1px;/);
	assert.match(input, /\.input:focus-visible\s*{\s*outline: var\(--focus-ring\);/);
	assert.match(select, /\.select:focus-visible\s*{\s*outline: var\(--focus-ring\);/);
	assert.match(textarea, /\.textarea:focus-visible\s*{\s*outline: var\(--focus-ring\);/);
	assert.match(sw, /\.switch:focus-visible\s*{\s*outline: var\(--focus-ring\);/);
	assert.match(checkbox, /input:focus-visible \+ \.box\s*{\s*outline: var\(--focus-ring\);/);
	assert.match(slider, /::-webkit-slider-thumb\s*{\s*outline: var\(--focus-ring\);/);
	assert.match(filterInput, /\.fi__bar:has\(:focus-visible\)\s*{\s*outline: var\(--focus-ring\);/);
});
