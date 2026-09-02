import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const icon = await readFile(
	new URL('../src/lib/components/atoms/Icon.svelte', import.meta.url),
	'utf8'
);

test('media / library glyphs are registered', () => {
	for (const name of ['music', 'tv', 'film', 'book', 'calendar', 'unlink', 'warning']) {
		assert.match(icon, new RegExp(`^\\t\\t'?${name}'?: '<`, 'm'), `missing glyph ${name}`);
	}
	assert.match(icon, /book: '<path d="M4 19\.5v-15A2\.5 2\.5 0 0 1 6\.5 2H19/);
});

test('alert aliases warning instead of duplicating its path data', () => {
	assert.match(icon, /const ICONS = { \.\.\.GLYPHS, alert: GLYPHS\.warning } as const;/);
	assert.match(icon, /export type IconName = keyof typeof ICONS;/);
	assert.equal((icon.match(/m21\.73 18-8-14a2 2 0 0 0-3\.48 0/g) ?? []).length, 1);
});
