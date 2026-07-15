import assert from 'node:assert/strict';
import test from 'node:test';
import { relativeTime, formatTimestamp } from '../src/lib/timestamp.ts';

const NOW = Date.UTC(2026, 0, 1, 12, 0, 0);
const S = 1000;
const M = 60 * S;
const H = 60 * M;
const D = 24 * H;

test('single-unit rounds to nearest instead of truncating', () => {
	assert.equal(relativeTime(NOW + D + 15 * H, NOW), 'in 2d');
	assert.equal(relativeTime(NOW - (H + 55 * M), NOW), '2h ago');
	assert.equal(relativeTime(NOW - (H + 20 * M), NOW), '1h ago');
});

test('rounding carries across unit boundaries', () => {
	assert.equal(relativeTime(NOW - (23 * H + 40 * M), NOW), '1d ago');
	assert.equal(relativeTime(NOW - (59 * M + 30 * S), NOW), '1h ago');
});

test('seconds bucket is unaffected', () => {
	assert.equal(relativeTime(NOW - 5 * S, NOW), '5s ago');
	assert.equal(relativeTime(NOW + 5 * S, NOW), 'in 5s');
});

test('precision renders two units and keeps the coarse unit exact', () => {
	assert.equal(relativeTime(NOW + D + 15 * H, NOW, true), 'in 1d 15h');
	assert.equal(relativeTime(NOW - (H + 55 * M), NOW, true), '1h 55m ago');
	assert.equal(relativeTime(NOW - (5 * M + 30 * S), NOW, true), '5m 30s ago');
});

test('precision drops a zero remainder', () => {
	assert.equal(relativeTime(NOW - 2 * D, NOW, true), '2d ago');
	assert.equal(relativeTime(NOW - 3 * H, NOW, true), '3h ago');
});

test('past ~30 days falls back to a locale date in both modes', () => {
	const old = new Date(NOW - 40 * D);
	assert.equal(relativeTime(old, NOW), old.toLocaleDateString());
	assert.equal(relativeTime(old, NOW, true), old.toLocaleDateString());
});

test('formatTimestamp threads precision into relative mode', () => {
	assert.equal(formatTimestamp(NOW + D + 15 * H, 'relative', NOW, false, true), 'in 1d 15h');
	assert.equal(formatTimestamp(NOW + D + 15 * H, 'relative', NOW), 'in 2d');
});

test('bad input returns empty string', () => {
	assert.equal(relativeTime('not-a-date', NOW), '');
	assert.equal(relativeTime(null, NOW, true), '');
});
