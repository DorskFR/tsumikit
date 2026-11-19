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

test('EmptyState chip takes its colour from the tone class, accent by default', () => {
	const src = emptyState;
	assert.match(src, /tone = 'accent',/);
	assert.match(src, /class="empty empty-{canonicalTone\(tone\)} /);
	assert.match(src, /\.empty-chip\s*{[^}]*color: var\(--accent\);[^}]*color-mix\(in srgb, currentColor 14%, transparent\)/);
	for (const [tone, token] of [
		['ok', '--ok'],
		['warn', '--warn'],
		['danger', '--danger'],
		['info', '--info'],
		['neutral', '--text-muted']
	])
		assert.match(src, new RegExp(`\\.empty-${tone} \\.empty-chip\\s*{\\s*color: var\\(${token}\\);`));
});
