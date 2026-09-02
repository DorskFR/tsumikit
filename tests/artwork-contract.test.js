import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { artworkGradient, artworkHue, initials } from '../src/lib/artwork.ts';

const [source, index] = await Promise.all([
	readFile(new URL('../src/lib/components/atoms/Artwork.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8')
]);

test('artworkGradient is deterministic, seed-sensitive and built on theme surface tokens', () => {
	assert.equal(artworkGradient('Kusaritoi'), artworkGradient('Kusaritoi'));
	assert.notEqual(artworkGradient('Kusaritoi'), artworkGradient('kusaritoi'));
	assert.match(artworkGradient('x'), /^linear-gradient\(/);
	assert.match(artworkGradient('x'), /var\(--bg-elevated-2\)/);
	assert.match(artworkGradient('x'), /var\(--bg-elevated\)/);
	assert.match(artworkGradient('x'), /hsl\(\d+ 60% 55%\)/);
	const hue = artworkHue('Kusaritoi');
	assert.ok(Number.isInteger(hue) && hue >= 0 && hue < 360);
	assert.equal(artworkHue(''), 0);
});

test('initials: first letters of the first two words, first two chars of a lone word, empty for blank', () => {
	assert.equal(initials('Kusaritoi Radio'), 'KR');
	assert.equal(initials('  the   long   title '), 'TL');
	assert.equal(initials('dorsk'), 'DO');
	assert.equal(initials('x'), 'X');
	assert.equal(initials('   '), '');
	assert.equal(initials('🎵 notes'), '🎵N');
});

test('Artwork prop surface: src, required alt, seed, aspect, size, radius, fit, fallback, icon, status, hover, onerror, class, rest', () => {
	assert.match(source, /src\?: string \| null;/);
	assert.match(source, /\n\t\talt: string;/);
	assert.match(source, /seed\?: string;/);
	assert.match(source, /aspect = '1\/1',/);
	assert.match(source, /aspect\?: '1\/1' \| '2\/3' \| '16\/9' \| \(string & {}\);/);
	assert.match(source, /size\?: string;/);
	assert.match(source, /radius = 'md',/);
	assert.match(source, /radius\?: 'sm' \| 'md' \| 'lg' \| 'pill';/);
	assert.match(source, /fit = 'cover',/);
	assert.match(source, /fallback = 'initials',/);
	assert.match(source, /fallback\?: 'initials' \| 'icon' \| 'none';/);
	assert.match(source, /icon\?: IconName;/);
	assert.match(source, /status\?: Snippet;/);
	assert.match(source, /hover = false,/);
	assert.match(source, /onerror\?: \(\) => void;/);
	assert.match(source, /class: klass = '',/);
	assert.match(source, /\.\.\.rest\n/);
	assert.match(source, /data-tsu="Artwork"/);
	assert.match(source, /\{\.\.\.rest\}/);
});

test('Artwork renders a lazy async image and latches to the fallback on error, resetting when src changes', () => {
	assert.match(source, /<img {src} {alt} class="img fit-{fit}" loading="lazy" decoding="async" onerror={fail} \/>/);
	assert.match(source, /let failed = \$state\(false\);/);
	assert.match(source, /\$effect\(\(\) => {\s*src;\s*failed = false;\s*}\);/);
	assert.match(source, /function fail\(\) {\s*failed = true;\s*onerror\?\.\(\);\s*}/);
	assert.match(source, /const showImage = \$derived\(Boolean\(src\) && !failed\);/);
	assert.match(source, /artworkGradient\(key\)/);
	assert.match(source, /const key = \$derived\(seed \?\? alt\);/);
	assert.match(source, /{:else if fallback === 'initials' && text}/);
	assert.match(source, /{:else if fallback === 'icon'}\s*<span class="glyph" aria-hidden="true"><Icon name={icon} \/><\/span>/);
});

test('Artwork sizing, a11y and status overlay', () => {
	assert.match(source, /style:aspect-ratio={aspect}/);
	assert.match(source, /style:width={size}/);
	assert.match(source, /style:background={gradient}/);
	assert.match(source, /role={showImage \? undefined : 'img'}/);
	assert.match(source, /aria-label={showImage \? undefined : alt}/);
	assert.match(source, /{#if status}\s*<span class="status">{@render status\(\)}<\/span>/);
	assert.match(source, /\.status\s*{[^}]*position: absolute;[^}]*right: var\(--sp-2\);[^}]*bottom: var\(--sp-2\);/s);
	assert.match(source, /\.hover:hover\s*{[^}]*border-color: var\(--border-strong\);[^}]*box-shadow: var\(--shadow-md\);/s);
	assert.match(source, /\.r-pill\s*{[^}]*border-radius: var\(--r-pill\);/s);
	assert.match(source, /\.fit-contain\s*{[^}]*object-fit: contain;/s);
});

test('Artwork and the artwork helpers are part of the public API', () => {
	assert.match(index, /export { default as Artwork } from '\.\/components\/atoms\/Artwork\.svelte';/);
	assert.match(index, /export { artworkGradient, artworkHue, initials } from '\.\/artwork';/);
});
