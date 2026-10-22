import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { BADGE_INK, BADGE_TINT, CARD_TINT, breaches, contrast, oklch, palettes } from './theme-contrast.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const [tokens, themes, store, badge, card, ...fields] = await Promise.all([
	read('src/lib/styles/tokens.css'),
	read('src/lib/styles/themes.css'),
	read('src/lib/stores/theme.svelte.ts'),
	read('src/lib/components/atoms/Badge.svelte'),
	read('src/lib/components/atoms/Card.svelte'),
	...['Input', 'Select', 'Textarea'].map((n) => read(`src/lib/components/atoms/${n}.svelte`))
]);
/** @param {number} w */
const pct = (w) => `${Math.round(w * 100)}%`;
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

test('the floors model the tints the components paint', () => {
	assert.ok(badge.includes(`color: var(--badge-fg, color-mix(in oklab, var(--badge-tone) ${pct(1 - BADGE_INK)}, var(--text)));`));
	assert.ok(badge.includes(`color-mix(in srgb, var(--badge-tone) ${pct(BADGE_TINT)}, transparent)`));
	assert.ok(card.includes(`background: color-mix(in srgb, var(--card-tone) ${pct(CARD_TINT)}, var(--surface-fill));`));
});

test('control boundaries and focus rings stay solid', () => {
	assert.match(tokens, /--track-edge: var\(--control-edge\);/);
	assert.match(badge, /\.action \{[^}]*\}/);
	assert.doesNotMatch(badge.match(/\.action \{[^}]*\}/)?.[0] ?? '', /opacity/);
	for (const src of fields) {
		assert.match(src, /0 0 0 var\(--focus-ring-width\) var\(--focus-tint\),/);
		assert.doesNotMatch(src, /0 0 0 \d+px color-mix\(in srgb, var\(--focus-tint\)/);
	}
	for (const src of [fields[0], fields[2]]) assert.match(src, /::placeholder \{\s*color: var\(--text-faint\);\s*opacity: 1;/);
});
