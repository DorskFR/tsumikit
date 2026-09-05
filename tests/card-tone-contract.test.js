import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const card = await readFile(new URL('../src/lib/components/atoms/Card.svelte', import.meta.url), 'utf8');

test('Card accepts a tone prop defaulting to neutral', () => {
	assert.match(card, /tone = 'neutral',/);
	assert.match(card, /tone\?: Tone;/);
	assert.match(card, /import { canonicalTone, type Tone as SharedTone } from '\$lib\/tone';/);
	assert.match(card, /const t = \$derived\(canonicalTone\(tone\)\);/);
});

test('tone toggles a card-<tone> class; neutral adds none', () => {
	for (const t of ['ok', 'warn', 'danger', 'info']) {
		assert.match(card, new RegExp(`class:card-${t}={t === '${t}'}`));
	}
	assert.doesNotMatch(card, /class:card-neutral/);
});

test('toned cards tint border and background from the semantic token', () => {
	for (const t of ['ok', 'warn', 'danger', 'info']) {
		assert.match(card, new RegExp(`\\.card-${t}\\s*{\\s*--card-tone: var\\(--${t}\\);`));
	}
	assert.match(card, /border-color: color-mix\(in srgb, var\(--card-tone\) \d+%, var\(--border\)\)/);
	assert.match(card, /background: color-mix\(in srgb, var\(--card-tone\) \d+%, var\(--bg-elevated\)\)/);
});

test('existing props are untouched', () => {
	for (const p of ['tap', 'as', 'padding', 'surface', 'stacked', 'stackTone', 'stackY', 'stackX']) {
		assert.match(card, new RegExp(`\\b${p}\\??:`));
	}
});
