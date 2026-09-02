import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/molecules/Field.svelte', import.meta.url),
	'utf8'
);

test('Field exposes a grow layout prop', () => {
	assert.match(source, /grow\?: boolean/);
	assert.match(source, /grow = false/);
	assert.match(source, /class:field-grow={grow}/);
	assert.match(source, /\.field-grow\s*{\s*flex: 1 1 0;\s*min-width: 0;/);
});
