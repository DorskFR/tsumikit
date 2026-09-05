import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { formatTimestamp, toShortISO } from '../src/lib/timestamp.ts';

const INSTANT = Date.UTC(2026, 5, 14, 7, 30, 0);
const LATE_UTC = Date.UTC(2026, 11, 31, 23, 30, 0);

test('toShortISO renders the UTC calendar date as YYYY-MM-DD', () => {
	assert.equal(toShortISO(new Date(INSTANT)), '2026-06-14');
	assert.equal(toShortISO(new Date(LATE_UTC)), '2026-12-31');
	assert.equal(toShortISO(new Date(Date.UTC(2026, 0, 5))), '2026-01-05');
});

test('toShortISO with utc=false follows the local zone', () => {
	const d = new Date(LATE_UTC);
	const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	assert.equal(toShortISO(d, false), expected);
	assert.match(toShortISO(d, false), /^\d{4}-\d{2}-\d{2}$/);
});

test('formatTimestamp short-iso is UTC by default and honours utc=false', () => {
	assert.equal(formatTimestamp(INSTANT, 'short-iso'), '2026-06-14');
	assert.equal(formatTimestamp('2026-06-14T07:30:00Z', 'short-iso', undefined, true), '2026-06-14');
	assert.equal(formatTimestamp(LATE_UTC, 'short-iso', undefined, false), toShortISO(new Date(LATE_UTC), false));
	assert.equal(formatTimestamp('nope', 'short-iso'), '');
	assert.equal(formatTimestamp(INSTANT, 'short-iso').length, 10);
});

test('Timestamp component exposes short-iso in the mode picker and keeps it static', () => {
	const src = readFileSync(new URL('../src/lib/components/molecules/Timestamp.svelte', import.meta.url), 'utf8');
	assert.match(src, /\{ id: 'short-iso', name: 'YYYY-MM-DD' \}/);
	assert.match(src, /if \(current !== 'relative'\) return;/);
	const helpers = readFileSync(new URL('../src/lib/timestamp.ts', import.meta.url), 'utf8');
	assert.match(helpers, /'iso' \| 'short-iso'/);
});
