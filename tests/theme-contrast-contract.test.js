import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { breaches, contrast, oklch, palettes } from './theme-contrast.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const [tokens, themes, store] = await Promise.all([
	read('src/lib/styles/tokens.css'),
	read('src/lib/styles/themes.css'),
	read('src/lib/stores/theme.svelte.ts')
]);
const { palettes: all } = palettes(tokens, themes);
const ids = [...store.matchAll(/\bid: '([a-z]+)'[^}]*mode: '(light|dark)'/g)].map((m) => m[1]);

test('every built-in theme palette is parsed, including the :root dark default', () => {
	assert.deepEqual(Object.keys(all).sort(), [...ids].sort());
});

for (const [id, p] of Object.entries(all)) {
	test(`${id} meets the WCAG AA contrast floors`, () => {
		assert.deepEqual(breaches(p), []);
	});

	test(`${id} keeps text > muted > faint`, () => {
		const [t, m, f] = ['text', 'text-muted', 'text-faint'].map((k) => contrast(p[k], p.bg));
		assert.ok(t > m && m > f, `${t.toFixed(2)} > ${m.toFixed(2)} > ${f.toFixed(2)}`);
	});
}

test('a dim tier sits between the bright and dark extremes', () => {
	const L = Object.values(all).map((p) => oklch(p.bg)[0]);
	assert.ok(L.filter((l) => l >= 0.34 && l <= 0.5).length >= 3, 'dim-dark bases');
	assert.ok(L.filter((l) => l >= 0.75 && l <= 0.89).length >= 3, 'dim-light bases');
});
