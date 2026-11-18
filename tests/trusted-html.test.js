import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-trusted-html.js');
const iconSource = await readFile(new URL('../src/lib/components/atoms/Icon.svelte', import.meta.url), 'utf8');
const GLYPHS = Object.fromEntries(
	Array.from(iconSource.matchAll(/^\t\t'?([\w-]+)'?: '(<.*)',$/gm), ([, name, markup]) => [name, markup])
);

class FakeTrustedHTML {
	/** @param {string} html */
	constructor(html) {
		this.html = html;
	}
	toString() {
		return this.html;
	}
}

/**
 * @param {{ trustedTypes?: boolean, setHTML?: (this: Element, html: string, opts?: { sanitizer?: object }) => void }} [opts]
 */
function boot({ trustedTypes = false, setHTML } = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
		url: 'http://localhost/'
	});
	const win = dom.window;
	/** @type {string[]} */
	const policies = [];
	if (trustedTypes) {
		Object.assign(win, {
			trustedTypes: {
				/** @param {string} name @param {{ createHTML(s: string): string }} rules */
				createPolicy(name, rules) {
					policies.push(name);
					return { createHTML: (/** @type {string} */ s) => new FakeTrustedHTML(rules.createHTML(s)) };
				}
			}
		});
		const inner = /** @type {PropertyDescriptor} */ (Object.getOwnPropertyDescriptor(win.Element.prototype, 'innerHTML'));
		Object.defineProperty(win.Element.prototype, 'innerHTML', {
			...inner,
			/** @param {unknown} value */
			set(value) {
				if (!(value instanceof FakeTrustedHTML)) throw new TypeError('This document requires TrustedHTML assignment.');
				inner.set?.call(this, String(value));
			}
		});
	}
	if (setHTML) Object.assign(win.Element.prototype, { setHTML });
	win.eval(bundle);
	const fx = win.__fixture;
	/** @param {unknown} component @param {Record<string, unknown>} props */
	const render = (component, props) => {
		const target = win.document.createElement('div');
		win.document.body.append(target);
		fx.mount(component, { target, props });
		fx.flushSync();
		return target;
	};
	return { win, fx, policies, render };
}

/** @param {string} markup */
const expected = (markup) =>
	Array.from(markup.matchAll(/<(\w+)([^>]*?)\s*\/>/g), ([, tag, attrs]) => ({
		tag,
		attrs: Object.fromEntries(Array.from(attrs.matchAll(/([\w-]+)="([^"]*)"/g), ([, k, v]) => [k, v]))
	}));
/** @param {Element} svg */
const rendered = (svg) =>
	Array.from(svg.children, (el) => ({ tag: el.localName, attrs: Object.fromEntries(Array.from(el.attributes, (at) => [at.name, at.value])) }));

test('every named Icon renders under Trusted Types enforcement with the registry markup', () => {
	const { fx, render } = boot({ trustedTypes: true });
	assert.ok(Object.keys(GLYPHS).length > 90);
	for (const [name, markup] of Object.entries(GLYPHS)) {
		const svg = /** @type {SVGSVGElement} */ (render(fx.Icon, { name }).querySelector('svg'));
		assert.deepEqual(rendered(svg), expected(markup), name);
		assert.doesNotMatch(svg.innerHTML, /class=/, name);
		for (const child of svg.children) assert.equal(child.namespaceURI, 'http://www.w3.org/2000/svg', name);
	}
	const alert = /** @type {SVGSVGElement} */ (render(fx.Icon, { name: 'alert' }).querySelector('svg'));
	assert.deepEqual(rendered(alert), expected(GLYPHS.warning));
});

test('Icon keeps the svg chrome: viewBox, stroke defaults, filled glyphs, aria', () => {
	const { fx, render } = boot({ trustedTypes: true });
	const svg = /** @type {SVGSVGElement} */ (render(fx.Icon, { name: 'star', label: 'Fav' }).querySelector('svg'));
	assert.equal(svg.getAttribute('viewBox'), '0 0 24 24');
	assert.equal(svg.getAttribute('fill'), 'currentColor');
	assert.equal(svg.getAttribute('stroke'), 'none');
	assert.equal(svg.getAttribute('role'), 'img');
	assert.equal(svg.getAttribute('aria-label'), 'Fav');
});

test('the Trusted Types shim rejects a plain string reaching {@html}', () => {
	const { fx, render } = boot({ trustedTypes: true });
	assert.throws(() => render(fx.Prose, { html: '<b>x</b>' }), /TrustedHTML/);
});

test('ChatBubble markdown renders under Trusted Types through the tsumikit policy', () => {
	const { fx, policies, render } = boot({ trustedTypes: true });
	const el = render(fx.ChatBubble, { markdown: '**bold** and [site](https://example.com)' });
	assert.equal(el.querySelector('strong')?.textContent, 'bold');
	assert.equal(el.querySelector('a')?.getAttribute('href'), 'https://example.com');
	assert.ok(policies.includes('tsumikit'));
	assert.equal(policies.filter((p) => p === 'tsumikit').length, 1);
});

test('renderTrustedMarkdown feeds Prose under Trusted Types and stays a string without it', () => {
	const tt = boot({ trustedTypes: true });
	const html = tt.fx.renderTrustedMarkdown('# Title');
	assert.ok(html instanceof FakeTrustedHTML);
	assert.equal(tt.render(tt.fx.Prose, { html }).querySelector('h1')?.textContent, 'Title');
	const plain = boot();
	assert.equal(typeof plain.fx.renderTrustedMarkdown('# Title'), 'string');
});

test('Prose and CodeBlock accept TrustedHTML on their HTML props', () => {
	const { fx, render } = boot({ trustedTypes: true });
	const html = new FakeTrustedHTML('<span class="hljs-keyword">const</span>');
	assert.ok(render(fx.Prose, { html }).querySelector('.hljs-keyword'));
	assert.ok(render(fx.CodeBlock, { code: 'const', html, copy: false }).querySelector('code .hljs-keyword'));
	assert.ok(render(fx.CodeBlock, { code: 'const', highlight: () => html, copy: false }).querySelector('code .hljs-keyword'));
});

const DIRTY = '<b>ok</b><img src="x" onerror="alert(1)">';

/** @returns {{ calls: { html: string, opts?: { sanitizer?: object } }[], setHTML: (this: Element, html: string, opts?: { sanitizer?: object }) => void }} */
function sanitizerSpy() {
	/** @type {{ html: string, opts?: { sanitizer?: object } }[]} */
	const calls = [];
	return {
		calls,
		setHTML(html, opts) {
			calls.push({ html, opts });
			this.innerHTML = html.replace(/<img[^>]*>/g, '');
		}
	};
}

test('Prose sanitize uses Element.setHTML with the sanitizer config when available', () => {
	const spy = sanitizerSpy();
	const { fx, render } = boot({ setHTML: spy.setHTML });
	const sanitizer = { elements: ['b'] };
	const fallback = () => {
		throw new Error('fallback must not run when setHTML exists');
	};
	const el = render(fx.Prose, { html: DIRTY, sanitize: { sanitizer, fallback } });
	assert.equal(spy.calls.length, 1);
	assert.equal(spy.calls[0].html, DIRTY);
	assert.equal(spy.calls[0].opts?.sanitizer, sanitizer);
	const prose = /** @type {HTMLElement} */ (el.querySelector('[data-tsu="Prose"]'));
	assert.equal(prose.innerHTML, '<b>ok</b>');
	assert.ok(prose.classList.contains('prose'));
	render(fx.Prose, { html: DIRTY, sanitize: true });
	assert.equal(spy.calls[1].opts, undefined);
});

test('Prose sanitize falls back to the consumer sanitize function without setHTML', () => {
	const { fx, render } = boot();
	/** @type {string[]} */
	const seen = [];
	const el = render(fx.Prose, {
		html: DIRTY,
		sanitize: { fallback: (/** @type {string} */ h) => (seen.push(h), '<b>clean</b>') }
	});
	assert.deepEqual(seen, [DIRTY]);
	assert.equal(el.querySelector('[data-tsu="Prose"]')?.innerHTML, '<b>clean</b>');
});

test('Prose sanitize with no setHTML and no fallback shows the markup as text', () => {
	const { fx, render } = boot();
	const prose = /** @type {HTMLElement} */ (render(fx.Prose, { html: DIRTY, sanitize: true }).querySelector('[data-tsu="Prose"]'));
	assert.equal(prose.textContent, DIRTY);
	assert.equal(prose.querySelector('img'), null);
});

test('without sanitize Prose and CodeBlock render HTML as-is, even where setHTML exists', () => {
	const spy = sanitizerSpy();
	const { fx, render } = boot({ setHTML: spy.setHTML });
	assert.ok(render(fx.Prose, { html: DIRTY }).querySelector('[data-tsu="Prose"] img[onerror]'));
	assert.ok(render(fx.CodeBlock, { code: 'x', html: DIRTY, copy: false }).querySelector('code.cb-code.hljs img[onerror]'));
	assert.equal(spy.calls.length, 0);
});

test('CodeBlock sanitize covers html and highlight output, setHTML first then fallback', () => {
	const spy = sanitizerSpy();
	const withApi = boot({ setHTML: spy.setHTML });
	const code = withApi.render(withApi.fx.CodeBlock, { code: 'x', highlight: () => DIRTY, sanitize: true, copy: false }).querySelector('code');
	assert.equal(spy.calls.length, 1);
	assert.ok(code?.classList.contains('cb-code') && code.classList.contains('hljs'));
	assert.equal(code?.innerHTML, '<b>ok</b>');

	const without = boot();
	const fallback = (/** @type {string} */ h) => h.replace(/<img[^>]*>/g, '');
	const viaFallback = without.render(without.fx.CodeBlock, { code: 'x', html: DIRTY, sanitize: { fallback }, copy: false });
	assert.equal(viaFallback.querySelector('code')?.innerHTML, '<b>ok</b>');
	const plain = without.render(without.fx.CodeBlock, { code: '<i>a</i>', sanitize: true, copy: false });
	assert.equal(plain.querySelector('code')?.textContent, '<i>a</i>');
	assert.equal(plain.querySelector('code i'), null);
});

test('prepaint CSP hashes match the sha256 of the prepaint scripts', () => {
	const { fx } = boot();
	/** @param {string} s */
	const sha = (s) => `sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}`;
	assert.equal(fx.THEME_PREPAINT_HASH, sha(fx.THEME_PREPAINT));
	assert.equal(fx.FX_PREPAINT_HASH, sha(fx.FX_PREPAINT));
});
