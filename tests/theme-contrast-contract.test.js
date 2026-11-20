import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { BADGE_INK, BADGE_TINT, CARD_TINT, INK_FLOOR, breaches, contrast, luminance, mixSrgb, oklch, palettes } from './theme-contrast.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const [tokens, themes, store, badge, card, badgeDemo, depth, ...fields] = await Promise.all([
	read('src/lib/styles/tokens.css'),
	read('src/lib/styles/themes.css'),
	read('src/lib/stores/theme.svelte.ts'),
	read('src/lib/components/atoms/Badge.svelte'),
	read('src/lib/components/atoms/Card.svelte'),
	read('src/demo/atoms/Badge/02-Variants.svelte'),
	read('src/lib/looks/depth.css'),
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
	for (const tone of ['ok', 'warn', 'danger', 'info', 'accent', 'text-muted', 'c-violet']) {
		assert.ok(badge.includes(`color: color-mix(in oklab, var(--${tone}) ${pct(1 - BADGE_INK)}, var(--text));`), tone);
		assert.ok(badge.includes(`background: color-mix(in srgb, var(--${tone}) ${pct(BADGE_TINT)}, transparent);`), tone);
	}
	for (const tone of ['ok', 'warn', 'danger', 'info', 'accent', 'attention-bar']) {
		assert.ok(card.includes(`background: color-mix(in srgb, var(--${tone}) ${pct(CARD_TINT)}, var(--surface-fill));`), tone);
	}
});

test('control boundaries and focus rings stay solid', () => {
	assert.match(tokens, /--track-edge: var\(--control-edge\);/);
	assert.match(badge, /\.action \{[^}]*\}/);
	assert.doesNotMatch(badge.match(/\.action \{[^}]*\}/)?.[0] ?? '', /opacity/);
	for (const src of fields) {
		assert.match(src, /0 0 0 var\(--focus-ring-width\) var\(--accent\),/);
		assert.match(src, /0 0 0 var\(--focus-ring-width\) var\(--danger\),/);
		assert.doesNotMatch(src, /0 0 0 [^,;]* color-mix\(/, 'the ring itself is never a tint');
	}
	for (const src of [fields[0], fields[2]]) assert.match(src, /::placeholder \{\s*color: var\(--text-faint\);\s*opacity: 1;/);
});

/** @param {string} css `hsl(H S% L%)` */
const hslHex = (css) => {
	const [h, sat, l] = (css.match(/[\d.]+/g) ?? []).map(Number);
	const a = (sat / 100) * Math.min(l / 100, 1 - l / 100);
	/** @param {number} n */
	const f = (n) => {
		const k = (n + h / 30) % 12;
		return Math.round((l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
	};
	return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

test('a solid custom badge draws its ink from its own colour', () => {
	const Y = '\\(0\\.2126 \\* r \\+ 0\\.7152 \\* g \\+ 0\\.0722 \\* b\\)';
	const channel = `clamp\\(0, \\(([\\d.]+) - ${Y}\\) \\* 1000, 1\\)`;
	const ink = `color: color\\(from currentColor srgb-linear ${channel} ${channel} ${channel}\\);`;
	const fallback = 'color: var\\(--text-on-accent\\);\\s*';
	const rest = badge.match(new RegExp(`\\.active > \\.badge-ink,\\s*\\.solid > \\.badge-ink \\{\\s*${fallback}${ink}\\s*\\}`));
	const hover = badge.match(
		new RegExp(`\\.interactive\\.active:hover > \\.badge-ink,\\s*\\.interactive\\.solid:hover > \\.badge-ink \\{\\s*${fallback}${ink}\\s*\\}`)
	);
	assert.ok(rest, 'ink rule');
	assert.ok(hover, 'hover ink rule');
	const cuts = [...rest.slice(1), ...hover.slice(1)].map(Number);
	assert.deepEqual(new Set(cuts).size, 1);
	/** @param {string} fill */
	const inkOn = (fill) => (luminance(fill) < cuts[0] ? '#ffffff' : '#000000');

	for (let v = 0; v < 256; v++) {
		for (const fill of [[v, v, v], [v, 0, 0], [0, v, 0], [0, 0, v], [v, v, 0], [0, v, v], [v, 0, v], [255, v, 128]]) {
			const hex = `#${fill.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
			assert.ok(contrast(inkOn(hex), hex) >= INK_FLOOR, hex);
		}
	}

	const demo = [...badgeDemo.matchAll(/<Badge color="(hsl\([^"]+\))" variant="solid">/g)].map((m) => hslHex(m[1]));
	assert.ok(demo.length > 0, 'demo solid custom badges');
	const sheen = depth.match(
		new RegExp(
			`\\.badge\\.solid\\.badge-custom:not\\(\\.active\\) \\{\\s*background: linear-gradient\\(180deg, color\\(from currentColor srgb-linear 1 1 1 / clamp\\(0, \\(${Y} - ([\\d.]+)\\) \\* 1000, ([\\d.]+)\\)\\) 0%, color\\(from currentColor srgb-linear 0 0 0 / clamp\\(0, \\(([\\d.]+) - ${Y}\\) \\* 1000, ([\\d.]+)\\)\\) 100%\\), currentColor;`
		)
	);
	assert.ok(sheen, 'depth sheen');
	const [litCut, lit, shadeCut, shade] = sheen.slice(1).map(Number);
	assert.deepEqual([litCut, shadeCut], [cuts[0], cuts[0]]);
	assert.doesNotMatch(depth, /\.badge\.solid\.badge-custom:not\(\.active\) \{\s*background: [^;]*var\(--text\)/);
	assert.match(depth, /\.badge\.active\.badge-custom > \.badge-ink \{\s*color: var\(--text-on-accent\);/);
	for (const fill of demo) {
		const dark = luminance(fill) < cuts[0];
		const ends = [fill, dark ? mixSrgb('#000000', fill, shade) : mixSrgb('#ffffff', fill, lit)];
		for (const end of ends) assert.ok(contrast(inkOn(fill), end) >= INK_FLOOR, `${fill} on ${end}`);
	}
});
