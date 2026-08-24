import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const emptyState = await readFile(
	new URL('../src/lib/components/molecules/EmptyState.svelte', import.meta.url),
	'utf8'
);

// Content between <Icon> tags materializes a children snippet, which Icon
// renders instead of `name` — a named icon must use a self-closing <Icon />.
test('EmptyState renders a named icon without passing a children snippet', () => {
	assert.match(emptyState, /\{#if iconChildren\}/);
	assert.match(emptyState, /<Icon name=\{icon\} \/>/);
	assert.doesNotMatch(emptyState, /<Icon name=\{icon\}>/);
});
