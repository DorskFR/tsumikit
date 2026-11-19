import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { artworkHue } from '../src/lib/artwork.ts';
import { avatarHue, avatarInitial } from '../src/lib/avatar.ts';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl, readDocs } from './helpers.mjs';
import { demoed, readDemo } from './helpers/demo-source.js';

const read = (/** @type {string} */ p) => readFile(new URL(p, import.meta.url), 'utf8');
const [source, index, readme, page, tokens, themes] = await Promise.all([
	read('../src/lib/components/atoms/Avatar.svelte'),
	read('../src/lib/index.ts'),
	readDocs('components.md'),
	readDemo(),
	read('../src/lib/styles/tokens.css'),
	read('../src/lib/styles/themes.css')
]);
const css = source.slice(source.indexOf('<style>'));
const bundle = await buildFixture('mount-avatar.js');

/** @param {Record<string, unknown>} props */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	mount(Fixture, { target: dom.window.document.body, props });
	flushSync();
	const el = /** @type {HTMLElement} */ (dom.window.document.querySelector('[data-tsu="Avatar"]'));
	return { el, text: el.querySelector('.text')?.textContent?.trim() };
}

test('avatarInitial keeps one grapheme, upper-cased, and is empty for blank', () => {
	assert.equal(avatarInitial('dorsk'), 'D');
	assert.equal(avatarInitial('  élodie '), 'É');
	assert.equal(avatarInitial('🧑‍🚀 pilot'), '🧑‍🚀');
	assert.equal(avatarInitial('🇯🇵'), '🇯🇵');
	assert.equal(avatarInitial('éa'), 'É');
	assert.equal(avatarInitial(''), '');
	assert.equal(avatarInitial('   '), '');
});

test('avatarHue is stable, in range and shares the Artwork hash', () => {
	assert.equal(avatarHue('nanachi'), avatarHue('nanachi'));
	assert.equal(avatarHue('nanachi'), artworkHue('nanachi'));
	assert.notEqual(avatarHue('nanachi'), avatarHue('Nanachi'));
	for (const s of ['', 'a', 'dorsk', 'x'.repeat(200)]) {
		const h = avatarHue(s);
		assert.ok(Number.isInteger(h) && h >= 0 && h < 360, `${s}: ${h}`);
	}
});

test('Avatar prop surface, anchor attribute and passthrough', () => {
	assert.match(source, /name = '',/);
	assert.match(source, /glyph\?: string;/);
	assert.match(source, /seed\?: string;/);
	assert.match(source, /hue\?: number;/);
	assert.match(source, /tone\?: 'accent' \| 'neutral' \| 'none';/);
	assert.match(source, /size\?: 'xs' \| 'sm' \| 'md' \| 'lg' \| number;/);
	assert.match(source, /size = 'md',/);
	assert.match(source, /shape\?: 'circle' \| 'square';/);
	assert.match(source, /shape = 'circle',/);
	assert.match(source, /decorative = false,/);
	assert.match(source, /status\?: Snippet;/);
	assert.match(source, /class: klass = '',/);
	assert.match(source, /data-tsu="Avatar"/);
	assert.match(source, /\{\.\.\.rest\}/);
	assert.match(index, /export \{ default as Avatar \} from '\.\/components\/atoms\/Avatar\.svelte';/);
	assert.match(index, /export \{ avatarHue, avatarInitial \} from '\.\/avatar';/);
});

test('Avatar uses theme tokens only, no colour literals', () => {
	assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
	assert.doesNotMatch(css, /rgba?\(/);
	assert.doesNotMatch(css, /hsl\(/);
	assert.doesNotMatch(source, /--avatar-/);
	assert.ok(hasDecl(css, '.avatar', 'border-radius', 'var(--r-pill)'));
	assert.ok(hasDecl(css, '.avatar', 'font-weight', 'var(--fw-semibold)'));
	assert.ok(hasDecl(css, '.avatar', 'flex', 'none'));
	assert.ok(hasDecl(css, '.avatar', 'width', '2rem'));
	assert.ok(hasDecl(css, '.avatar', 'font-size', 'calc(2rem * 0.46)'));
	assert.ok(hasDecl(css, '.square', 'border-radius', 'calc(2rem / 4)'));
	for (const [size, box] of [['xs', '1.25rem'], ['sm', '1.5rem'], ['lg', '2.5rem']]) {
		assert.ok(hasDecl(css, `.size-${size}`, 'width', box));
		assert.ok(hasDecl(css, `.size-${size}`, 'height', box));
		assert.ok(hasDecl(css, `.size-${size}`, 'font-size', `calc(${box} * 0.46)`));
		assert.ok(hasDecl(css, `.square.size-${size}`, 'border-radius', `calc(${box} / 4)`));
		assert.ok(hasDecl(css, `.glyph.size-${size}`, 'font-size', `calc(${box} * 0.72)`));
	}
	assert.ok(hasDecl(css, '.status', 'box-shadow', '0 0 0 2px var(--bg-elevated)'));
});

const HUED_BG = /background: color-mix\(in srgb, hsl\(\$\{resolvedHue\} var\(--mach-bg-sl\)\) (\d+)%, var\(--bg\)\)/;
const HUED_FG = /color: color-mix\(in srgb, hsl\(\$\{resolvedHue\} var\(--mach-fg-sl\)\) (\d+)%, var\(--text\)\)/;

/** Hue of the inline hashed fill. @param {Element} el */
const hueOf = (el) => el.getAttribute('style')?.match(/background: color-mix\(in srgb, hsl\((\d+) /)?.[1] ?? '';

/** @param {number} h @param {number} s @param {number} l */
function hslToRgb(h, s, l) {
	s /= 100;
	l /= 100;
	const k = (/** @type {number} */ n) => (n + h / 30) % 12;
	const a = s * Math.min(l, 1 - l);
	const f = (/** @type {number} */ n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
	return [f(0), f(8), f(4)];
}
/** @param {string} hex */
function hexToRgb(hex) {
	let x = hex.slice(1);
	if (x.length === 3) x = [...x].map((c) => c + c).join('');
	return [0, 2, 4].map((i) => Number.parseInt(x.slice(i, i + 2), 16) / 255);
}
/** @param {number[]} rgb */
function luminance([r, g, b]) {
	const lin = (/** @type {number} */ v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
/** @param {number[]} a @param {number[]} b */
function contrast(a, b) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
	return (hi + 0.05) / (lo + 0.05);
}
/** sRGB `color-mix(in srgb, a p%, b)`. @param {number[]} a @param {number[]} b @param {number} p */
const mix = (a, b, p) => a.map((v, i) => v * p + b[i] * (1 - p));

test('hashed avatars clear AA (4.5:1) at every hue on every bundled theme', () => {
	const bgPct = Number(source.match(HUED_BG)?.[1]);
	const fgPct = Number(source.match(HUED_FG)?.[1]);
	assert.ok(bgPct > 0 && fgPct > 0, 'hued fill and ink derive from the --mach-*-sl pairs');
	const blocks = [...`${tokens}${themes}`.matchAll(/(\[data-theme=[^\]]*\]|:root)[^{]*\{([^}]*)\}/g)];
	let checked = 0;
	for (const [, name, body] of blocks) {
		const bg = body.match(/--mach-bg-sl:\s*([\d.]+)%\s+([\d.]+)%/);
		const fg = body.match(/--mach-fg-sl:\s*([\d.]+)%\s+([\d.]+)%/);
		const text = body.match(/--c-text:\s*(#[0-9a-fA-F]{3,6})/);
		const surface = body.match(/--c-bg:\s*(#[0-9a-fA-F]{3,6})/);
		if (!bg || !fg || !text || !surface) continue;
		checked++;
		for (let h = 0; h < 360; h++) {
			const fill = mix(hslToRgb(h, Number(bg[1]), Number(bg[2])), hexToRgb(surface[1]), bgPct / 100);
			const ink = mix(hslToRgb(h, Number(fg[1]), Number(fg[2])), hexToRgb(text[1]), fgPct / 100);
			const c = contrast(fill, ink);
			assert.ok(c >= 4.5, `${name} hue ${h}: ${c.toFixed(2)}`);
		}
	}
	assert.ok(checked >= 20, `themes checked: ${checked}`);
});

test('same seed yields the same hue; seed and hue override name', () => {
	const a = render({ name: 'nanachi' });
	const b = render({ name: 'nanachi' });
	assert.equal(hueOf(a.el), hueOf(b.el));
	assert.equal(hueOf(a.el), String(avatarHue('nanachi')));
	const seeded = render({ name: 'Display Name', seed: 'user-42' });
	assert.equal(hueOf(seeded.el), String(avatarHue('user-42')));
	assert.equal(hueOf(render({ name: 'x', hue: 210 }).el), '210');
	assert.match(a.el.getAttribute('style') ?? '', /; color: color-mix\(in srgb, hsl\(\d+ var\(--mach-fg-sl\)\) 25%, var\(--text\)\);$/);
	assert.ok(a.el.classList.contains('hued'));
});

test('initial, glyph override and the ? fallback', () => {
	assert.equal(render({ name: 'nanachi' }).text, 'N');
	assert.equal(render({ name: '🧑‍🚀 pilot' }).text, '🧑‍🚀');
	const g = render({ name: 'work', glyph: '🐙' });
	assert.equal(g.text, '🐙');
	assert.ok(g.el.classList.contains('glyph'));
	assert.equal(render({ name: '' }).text, '?');
	assert.equal(render({ name: 'nanachi', glyph: '  ' }).text, 'N');
});

test('decorative toggles aria-hidden; otherwise role="img" with aria-label=name', () => {
	const named = render({ name: 'nanachi' });
	assert.equal(named.el.getAttribute('role'), 'img');
	assert.equal(named.el.getAttribute('aria-label'), 'nanachi');
	assert.equal(named.el.hasAttribute('aria-hidden'), false);
	assert.equal(named.el.querySelector('.text')?.getAttribute('aria-hidden'), 'true');
	const deco = render({ name: 'nanachi', decorative: true });
	assert.equal(deco.el.getAttribute('aria-hidden'), 'true');
	assert.equal(deco.el.hasAttribute('role'), false);
	assert.equal(deco.el.hasAttribute('aria-label'), false);
});

test('tone drops the hashed hue; size number is px; shape/class/rest pass through', () => {
	const accent = render({ name: 'n', tone: 'accent' });
	assert.ok(accent.el.classList.contains('accent'));
	assert.ok(!accent.el.classList.contains('hued'));
	assert.equal(accent.el.hasAttribute('style'), false);
	assert.ok(render({ name: 'n', tone: 'neutral' }).el.classList.contains('neutral'));
	assert.ok(render({ name: 'n', tone: 'none' }).el.classList.contains('bare'));
	const px = render({ name: 'n', size: 26 });
	assert.equal(px.el.style.width, '26px');
	assert.equal(px.el.style.height, '26px');
	assert.equal(px.el.style.fontSize, 'calc(11.96px)');
	assert.equal(render({ name: 'n', size: 26, glyph: '🐙' }).el.style.fontSize, 'calc(18.72px)');
	assert.equal(render({ name: 'n', size: 26, shape: 'square' }).el.style.borderRadius, 'calc(6.5px)');
	assert.ok(render({ name: 'n', size: 'xs' }).el.classList.contains('size-xs'));
	assert.equal(render({ name: 'n', size: 'md', tone: 'neutral' }).el.hasAttribute('style'), false);
	const sq = render({ name: 'n', shape: 'square' });
	assert.ok(sq.el.classList.contains('square'));
	assert.ok(sq.el.classList.contains('probe'));
	assert.equal(sq.el.dataset.probe, 'x');
});

test('status snippet renders in the corner slot only when given', () => {
	const with_ = render({ name: 'n', withStatus: true });
	assert.ok(with_.el.querySelector('.status [data-tsu="Dot"]'));
	assert.equal(render({ name: 'n' }).el.querySelector('.status'), null);
});

test('Avatar is documented and demoed', async () => {
	assert.match(readme, /Avatar \(/);
	assert.match(readme, /### Avatar/);
	assert.ok(await demoed('Avatar'));
});
