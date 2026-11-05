import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl, normalize, rule } from './helpers.mjs';
import { contrast, palettes } from './theme-contrast.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(p, import.meta.url), 'utf8');
const [source, index, tokens, themes] = await Promise.all([
	read('../src/lib/components/layouts/Backdrop.svelte'),
	read('../src/lib/index.ts'),
	read('../src/lib/styles/tokens.css'),
	read('../src/lib/styles/themes.css')
]);
const css = normalize(source.slice(source.indexOf('<style>') + '<style>'.length));
const bundle = await buildFixture('mount-backdrop.js');
const { palettes: all } = palettes(tokens, themes);

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
	const el = /** @type {HTMLElement} */ (dom.window.document.querySelector('[data-tsu="Backdrop"]'));
	return {
		el,
		artwork: /** @type {HTMLElement} */ (el.querySelector('[data-tsu="Artwork"]')),
		content: /** @type {HTMLElement} */ (el.querySelector('.content'))
	};
}

const pct = (/** @type {string} */ selector, /** @type {string} */ prop) => {
	const v = rule(css, selector)[prop];
	assert.match(v ?? '', /^\d+%$/, `${selector} ${prop}`);
	return Number(v.slice(0, -1)) / 100;
};

const over = (/** @type {string} */ fg, /** @type {string} */ bg, /** @type {number} */ alpha) =>
	`#${[1, 3, 5]
		.map((i) => {
			const a = Number.parseInt(fg.slice(i, i + 2), 16);
			const b = Number.parseInt(bg.slice(i, i + 2), 16);
			return Math.round(a * alpha + b * (1 - alpha))
				.toString(16)
				.padStart(2, '0');
		})
		.join('')}`;

test('Backdrop prop surface: src, required alt, seed, height, fade, blur, dim, Artwork fallback props, class, rest', () => {
	assert.match(source, /src\?: string \| null;/);
	assert.match(source, /\n\t\talt: string;/);
	assert.match(source, /seed\?: string;/);
	assert.match(source, /height\?: string;/);
	assert.match(source, /fade\?: 'bottom' \| 'none';/);
	assert.match(source, /fade = 'bottom',/);
	assert.match(source, /blur = false,/);
	assert.match(source, /dim = false,/);
	assert.match(source, /fallback\?: 'initials' \| 'icon' \| 'none';/);
	assert.match(source, /icon\?: IconName;/);
	assert.match(source, /onerror\?: \(\) => void;/);
	assert.match(source, /as\?: 'div' \| 'header' \| 'section';/);
	assert.match(source, /data-tsu="Backdrop"/);
	assert.match(source, /style:--backdrop-h={height}/);
	assert.match(source, /\{\.\.\.rest\}/);
	assert.match(normalize(source), /<Artwork {src} {srcset} {sizes} {alt} {seed} {fit} {fallback} {icon} {onerror} aspect="auto" radius="sm" \/>/);
});

test('the fade is a bottom gradient that ends at var(--bg), on a var(--bg) box, so it meets the page in every theme', () => {
	const fade = rule(css, '.media::after')['background-image'];
	assert.match(fade, /^linear-gradient\( to bottom, transparent [^,]+, var\(--bg\) 100% \)$/);
	assert.ok(hasDecl(css, '.backdrop', 'background', 'var(--bg)'));
	assert.ok(hasDecl(css, '.fade-none .media::after', 'background-image', 'none'));
	for (const [id, p] of Object.entries(all)) assert.match(p.bg, /^#[0-9a-f]{6}$/, `${id} defines --c-bg`);
});

test('children sit on a scrim mixed from --bg that reads at >= 4.5:1 over a white picture in every theme', () => {
	assert.ok(hasDecl(css, '.content', 'background', 'color-mix(in srgb, var(--bg) var(--backdrop-scrim), transparent)'));
	assert.ok(hasDecl(css, '.content', 'position', 'relative'));
	assert.ok(hasDecl(css, '.backdrop', 'color', 'var(--text)'));
	const alpha = pct('.backdrop', '--backdrop-scrim');
	for (const [id, p] of Object.entries(all)) {
		const ratio = contrast(p.text, over(p.bg, '#ffffff', alpha));
		assert.ok(ratio >= 4.5, `${id}: ${ratio.toFixed(2)} < 4.5`);
	}
});

test('reduced transparency and more contrast get an opaque scrim; reduced transparency also drops the blur', () => {
	const reduced = css.match(/@media \(prefers-reduced-transparency: reduce\) {(.*?)} }/)?.[1] ?? '';
	const more = css.match(/@media \(prefers-contrast: more\) {(.*?)} }/)?.[1] ?? '';
	assert.match(reduced, /\.backdrop { --backdrop-scrim: 100%; }/);
	assert.match(reduced, /filter: none;/);
	assert.match(more, /--backdrop-scrim: 100%;/);
	const base = pct('.backdrop', '--backdrop-scrim');
	assert.ok(base < 1, 'the default scrim lets the picture through');
});

test('renders the Artwork under the content, and the content after it in DOM order', () => {
	const { el, artwork, content } = render({ src: 'https://example.test/hero.jpg' });
	assert.ok(artwork);
	assert.ok(content);
	assert.equal(content.querySelector('h1')?.textContent, 'Night drive');
	assert.ok(artwork.compareDocumentPosition(content) & 4, 'content follows the artwork');
	assert.ok(artwork.querySelector('img'));
	assert.equal(el.getAttribute('aria-label'), 'Album header');
	assert.equal(el.dataset.testid, 'hero');
	assert.ok(el.classList.contains('fade-bottom'));
});

test('a missing src shows the Artwork placeholder (seeded gradient with initials), no img', () => {
	const { artwork } = render({ src: null, alt: 'Night drive' });
	assert.equal(artwork.querySelector('img'), null);
	assert.equal(artwork.querySelector('.initials')?.textContent, 'ND');
	assert.match(artwork.getAttribute('style') ?? '', /linear-gradient/);
	assert.equal(artwork.getAttribute('role'), 'img');
	assert.equal(artwork.getAttribute('aria-label'), 'Night drive');
});

test('fade="none" and height flow to classes and the --backdrop-h variable', () => {
	const { el } = render({ fade: 'none' });
	assert.ok(el.classList.contains('fade-none'));
	assert.ok(hasDecl(css, '.backdrop', 'min-height', /^var\(--backdrop-h, /));
});

test('Backdrop is part of the public API', () => {
	assert.match(index, /export { default as Backdrop } from '\.\/components\/layouts\/Backdrop\.svelte';/);
});
