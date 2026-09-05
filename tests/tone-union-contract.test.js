import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { canonicalTone } from '../src/lib/tone.ts';

const root = new URL('../src/lib/components/', import.meta.url);
const files = (await readdir(root, { recursive: true })).filter((f) => f.endsWith('.svelte'));

// Emphasis axes (Heading/Text/Link/Timestamp) and non-semantic tone sets are a
// different vocabulary and are exempt.
const EXEMPT = new Set([
	'atoms/Heading.svelte',
	'atoms/Link.svelte',
	'atoms/Gauge.svelte',
	'atoms/Badge.svelte',
	'molecules/Timestamp.svelte',
	'molecules/Fieldset.svelte',
	'molecules/Popover.svelte'
]);

test('every semantic tone prop is typed as the shared Tone (plus optional extras)', async () => {
	for (const f of files) {
		if (EXEMPT.has(f)) continue;
		const src = await readFile(new URL(f, root), 'utf8');
		const m = src.match(/^\t\ttone\?: ([^;]+);/m);
		if (!m) continue;
		assert.match(m[1], /\b(Tone|KeyValueTone)\b/, `${f} declares tone?: ${m[1]}`);
	}
});

test('canonicalTone folds success onto ok and leaves the rest alone', () => {
	assert.equal(canonicalTone('success'), 'ok');
	assert.equal(canonicalTone('danger'), 'danger');
	assert.equal(canonicalTone('none'), 'none');
});
