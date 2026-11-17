import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { contrast, oklch, palettes } from './theme-contrast.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const [tokens, themes, picker] = await Promise.all([
	read('src/lib/styles/tokens.css'),
	read('src/lib/styles/themes.css'),
	read('src/lib/components/molecules/ThemePicker.svelte')
]);
const { palettes: all } = palettes(tokens, themes);

/** Accent must sit this far (OKLab ΔE) from every status colour so "do this" never reads as "this succeeded". */
const MIN_DELTA_E = 0.08;
const STATUS = ['green', 'amber', 'red'];
const MIN_HUE_GAP = 30;

/** @param {string} hex */
const oklab = (hex) => {
	const [L, C, H] = oklch(hex);
	return [L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)];
};
/** @param {string} hex */
const hue = (hex) => {
	const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
	const max = Math.max(r, g, b);
	const d = max - Math.min(r, g, b);
	if (d === 0) return 0;
	const h = max === r ? (g - b) / d : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
	return (h * 60 + 360) % 360;
};
/** @param {number} a @param {number} b */
const hueGap = (a, b) => {
	const d = Math.abs(a - b) % 360;
	return Math.min(d, 360 - d);
};
/** @param {string} a @param {string} b */
const deltaE = (a, b) => {
	const [x, y] = [oklab(a), oklab(b)];
	return Math.hypot(...x.map((v, i) => v - y[i]));
};

test('hue is the HSL hue in degrees and gaps wrap around red', () => {
	assert.equal(hue('#ff0000'), 0);
	assert.equal(hue('#00ff00'), 120);
	assert.equal(hue('#0000ff'), 240);
	assert.equal(hue('#ff00ff'), 300);
	assert.equal(Math.round(hue('#bbd594')), 84);
	assert.equal(hueGap(350, 10), 20);
});

test('every theme block is covered, with :root as the dark default', () => {
	assert.ok(Object.keys(all).length >= 31);
	assert.ok('dark' in all);
});

for (const [id, own] of Object.entries(all)) {
	const p = { ...all.dark, ...own };
	test(`${id}: accent is a different colour from green, amber and red`, () => {
		for (const tone of STATUS) {
			const d = deltaE(p.accent, p[tone]);
			assert.ok(d >= MIN_DELTA_E, `accent ${p.accent} vs ${tone} ${p[tone]}: ΔE ${d.toFixed(3)} < ${MIN_DELTA_E}`);
		}
	});

	test(`${id}: accent hue is at least ${MIN_HUE_GAP}° from green, amber and red`, () => {
		for (const tone of STATUS) {
			const gap = hueGap(hue(p.accent), hue(p[tone]));
			assert.ok(gap >= MIN_HUE_GAP, `accent ${p.accent} vs ${tone} ${p[tone]}: ${gap.toFixed(1)}° < ${MIN_HUE_GAP}°`);
		}
	});

	test(`${id}: accent ink stays readable on the accent fill`, () => {
		const r = contrast(p['accent-ink'], p.accent);
		assert.ok(r >= 4.5, `${p['accent-ink']} on ${p.accent} = ${r.toFixed(2)}`);
	});
}

test('the ThemePicker dark swatch repaints the :root accent', () => {
	const swatch = picker.match(/\.swatch\[data-theme='dark'\] {([^}]*)}/)?.[1] ?? '';
	assert.match(swatch, new RegExp(`--c-accent: ${all.dark.accent};`));
	assert.match(swatch, new RegExp(`--c-bg: ${all.dark.bg};`));
});
