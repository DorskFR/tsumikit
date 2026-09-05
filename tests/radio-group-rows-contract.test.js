import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const src = await readFile(
	new URL('../src/lib/components/molecules/RadioGroup.svelte', import.meta.url),
	'utf8'
);

test('RadioGroup exposes a rows variant and typed action/below snippets', () => {
	assert.match(src, /variant\?: 'list' \| 'rows'/);
	assert.match(src, /action\?: Snippet<\[RadioOption\]>/);
	assert.match(src, /below\?: Snippet<\[RadioOption\]>/);
	assert.match(src, /data-variant={variant}/);
});

test('option shape gains description and note', () => {
	assert.match(src, /description\?: string/);
	assert.match(src, /note\?: string/);
	assert.match(src, /{#if o\.note}<span class="note">{o\.note}<\/span>{\/if}/);
	assert.match(src, /{#if o\.description}<span class="description">{o\.description}<\/span>{\/if}/);
	assert.match(src, /\.note\s*{[^}]*color: var\(--text-faint\);/s);
});

test('rows: bordered row, selected row uses --accent-dim border and --bg-elevated', () => {
	assert.match(src, /class="row" class:selected={o\.value === value}/);
	assert.match(src, /\.row\s*{[^}]*border: 1px solid var\(--border\);[^}]*border-radius: var\(--r-md\);/s);
	assert.match(src, /\.row\s*{[^}]*padding: var\(--pad,/s);
	assert.match(src, /\.row\.selected\s*{[^}]*border-color: var\(--accent-dim\);[^}]*background: var\(--bg-elevated\);/s);
});

test('rows: action renders outside the label so clicking it never toggles the radio', () => {
	const row = src.slice(src.indexOf('<div class="row"'), src.indexOf('{#if below}'));
	const labelEnd = row.indexOf('</label>');
	const actionAt = row.indexOf('{@render action(o)}');
	assert.ok(labelEnd > 0 && actionAt > labelEnd);
	assert.match(row, /<label class="radio">[\s\S]*<input type="radio"/);
	assert.match(src, /\.action\s*{[^}]*margin-left: auto;/s);
});

test('rows: below snippet renders under its own option row only', () => {
	assert.match(src, /<div class="row-wrap">[\s\S]*<\/div>\s*{#if below}<div class="below">{@render below\(o\)}<\/div>{\/if}\s*<\/div>/);
	assert.match(src, /\.below:empty\s*{[^}]*display: none;/s);
});
