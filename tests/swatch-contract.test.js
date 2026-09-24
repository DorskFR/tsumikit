import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { compile, preprocess } from 'svelte/compiler';
import { hasDecl, normalize } from './helpers.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
const [swatch, index, readme, page] = await Promise.all([
	read('../src/lib/components/atoms/Swatch.svelte'),
	read('../src/lib/index.ts'),
	read('../README.md'),
	read('../src/routes/+page.svelte'),
]);
const css = swatch.slice(swatch.indexOf('<style>'));
const flat = normalize(swatch);

test('Swatch is exported, documented and demoed', () => {
	assert.match(index, /export \{ default as Swatch \} from '\.\/components\/atoms\/Swatch\.svelte';/);
	assert.match(readme, /Swatch \(colour chip:/);
	assert.match(page, /<section class="section" id="swatch">/);
	assert.match(page, /<Swatch[^>]*interactive[^>]*aria-pressed|<Swatch\s[^>]*interactive/);
});

test('Swatch prop surface: colour, Dot/Badge size scale, shape, label, selected, interactive', () => {
	assert.match(swatch, /color: string;/);
	assert.match(swatch, /size\?: ControlSize;/);
	assert.match(swatch, /shape\?: 'circle' \| 'square';/);
	assert.match(swatch, /label\?: string;/);
	assert.match(swatch, /selected\?: boolean;/);
	assert.match(swatch, /interactive\?: boolean;/);
	assert.match(swatch, /onclick\?: \(e: MouseEvent\) => void;/);
	assert.match(swatch, /size = 'md'/);
	assert.match(swatch, /shape = 'circle'/);
	assert.match(swatch, /selected = false/);
	assert.match(swatch, /interactive = false/);
	assert.match(flat, /\.\.\.rest \}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = \$props\(\);/);
});

test('Swatch root carries the anchor attribute, class passthrough and the colour custom property', () => {
	assert.match(swatch, /data-tsu="Swatch"/);
	assert.match(swatch, /class="swatch \{klass\}"/);
	assert.match(swatch, /style:--swatch-color=\{color\}/);
	assert.match(swatch, /\{\.\.\.rest\}/);
	assert.equal(hasDecl(css, '.swatch', 'background', 'var(--swatch-color)'), true);
});

test('Swatch polymorphism: span by default, button when interactive', () => {
	assert.match(swatch, /this=\{interactive \? 'button' : 'span'\}/);
	assert.match(swatch, /type=\{interactive \? 'button' : undefined\}/);
	assert.match(swatch, /aria-pressed=\{interactive \? selected : undefined\}/);
	assert.match(swatch, /onclick=\{interactive \? onclick : undefined\}/);
});

test('Swatch a11y: label → role=img + aria-label, no label → aria-hidden, buttons always named', () => {
	assert.match(swatch, /role=\{!interactive && label \? 'img' : undefined\}/);
	assert.match(swatch, /aria-hidden=\{!interactive && !label \? 'true' : undefined\}/);
	assert.match(swatch, /aria-label=\{interactive \? \(label \?\? color\) : label\}/);
});

test('Swatch uses only tokens: hairline border, radii, selection ring, focus ring', () => {
	assert.equal(hasDecl(css, '.swatch', 'border', '1px solid var(--border)'), true);
	assert.equal(hasDecl(css, '.swatch', 'border-radius', 'var(--r-pill)'), true);
	assert.equal(hasDecl(css, '.square', 'border-radius', 'var(--r-sm)'), true);
	assert.equal(hasDecl(css, '.sm', '--swatch-size'), true);
	assert.equal(hasDecl(css, '.lg', '--swatch-size'), true);
	assert.match(css, /\.selected \{[^}]*border-color: var\(--text\);/);
	assert.match(css, /\.selected \{[^}]*0 0 0 2px var\(--bg\),\s*0 0 0 3px var\(--text\)/);
	assert.match(css, /\.interactive \{[^}]*cursor: pointer;/);
	assert.match(css, /\.interactive:focus-visible \{[^}]*outline: 2px solid var\(--accent\);/);
	assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
	assert.doesNotMatch(css, /\b(?:rgb|hsl)a?\(/);
});

test('Swatch compiles for client and server', async () => {
	const { code } = await preprocess(swatch, vitePreprocess(), { filename: 'Swatch.svelte' });
	for (const generate of /** @type {const} */ (['client', 'server'])) {
		const out = compile(code, { generate, filename: 'Swatch.svelte' });
		assert.equal(out.warnings.length, 0, `${generate}: ${out.warnings.map((w) => w.message).join('; ')}`);
	}
});
