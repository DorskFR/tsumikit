import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { compile } from 'svelte/compiler';
import { buildFixture } from './fixtures/build.mjs';

const file = new URL('../src/lib/components/layouts/AppShell.svelte', import.meta.url);
const source = await readFile(file, 'utf8');
const bundle = await buildFixture('mount-app-shell.svelte.js');
const css = compile(source, { filename: 'AppShell.svelte', css: 'external' }).css?.code.replace(/\s+/g, ' ') ?? '';

/** @param {Record<string, unknown>} init */
function render(init = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		url: 'https://app.test/',
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const mq = { matches: true, addEventListener() {}, removeEventListener() {} };
	dom.window.matchMedia = /** @type {any} */ (() => mq);
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture, props } = dom.window.__fixture;
	const live = props({ open: false, changes: [], ...init });
	mount(Fixture, { target: dom.window.document.body, props: live });
	flushSync();
	const doc = dom.window.document;
	const q = (/** @type {string} */ sel) => /** @type {HTMLElement} */ (doc.querySelector(sel));
	const toggle = () => q('button[aria-label="Toggle navigation"]');
	const key = (/** @type {EventTarget} */ el, /** @type {string} */ k) => {
		el.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
		flushSync();
	};
	return { dom, doc, q, toggle, key, props: live, flush: flushSync };
}

/** @param {Element | null} el */
function isInert(el) {
	for (; el; el = el.parentElement) if (/** @type {any} */ (el).inert || el.hasAttribute('inert')) return true;
	return false;
}

test('open drawer makes the header snippet inert but keeps the hamburger reachable', () => {
	const r = render();
	assert.equal(isInert(r.q('[data-test="search"]')), false);
	r.toggle().click();
	r.flush();
	assert.equal(isInert(r.q('[data-test="search"]')), true);
	assert.equal(isInert(r.toggle()), false);
	assert.equal(isInert(r.q('main')), true);
	assert.equal(isInert(r.q('[data-test="local"]')), false);
});

test('opening focuses the first drawer control; Escape returns focus to the toggle', () => {
	const r = render();
	r.toggle().focus();
	r.toggle().click();
	r.flush();
	assert.equal(r.doc.activeElement, r.q('[data-test="local"]'));
	r.key(r.dom.window, 'Escape');
	assert.equal(r.doc.activeElement, r.toggle());
});

test('closing via the scrim or bind:open also returns focus to the toggle', () => {
	const r = render();
	r.toggle().click();
	r.flush();
	r.q('.shell-scrim').click();
	r.flush();
	assert.equal(r.doc.activeElement, r.toggle());

	r.props.open = true;
	r.flush();
	assert.equal(r.doc.activeElement, r.q('[data-test="local"]'));
	r.props.open = false;
	r.flush();
	assert.equal(r.doc.activeElement, r.toggle());
});

test('closing does not steal focus that already moved outside the drawer', () => {
	const r = render();
	r.toggle().click();
	r.flush();
	const outside = r.doc.createElement('button');
	r.doc.body.append(outside);
	outside.focus();
	r.props.open = false;
	r.flush();
	assert.equal(r.doc.activeElement, outside);
});

test('resize handle is a focusable separator with a value and arrow/Home/End keys', () => {
	const r = render({ resizableSidebar: true, sidebarWidthKey: 'shell-w' });
	const handle = r.q('.shell-sidebar-resize');
	assert.equal(handle.getAttribute('role'), 'separator');
	assert.equal(handle.getAttribute('tabindex'), '0');
	assert.equal(handle.getAttribute('aria-valuemin'), '100');
	assert.equal(handle.getAttribute('aria-valuemax'), '300');
	r.key(handle, 'End');
	assert.equal(handle.getAttribute('aria-valuenow'), '300');
	assert.equal(r.dom.window.localStorage.getItem('shell-w'), '300');
	r.key(handle, 'ArrowLeft');
	assert.equal(handle.getAttribute('aria-valuenow'), '284');
	r.key(handle, 'Home');
	assert.equal(handle.getAttribute('aria-valuenow'), '100');
	r.key(handle, 'ArrowRight');
	assert.equal(handle.getAttribute('aria-valuenow'), '116');
	assert.equal(r.dom.window.localStorage.getItem('shell-w'), '116');
	assert.match(r.q('.shell').getAttribute('style') ?? '', /--shell-sidebar-w: 116px/);
});

test('header height adds the top safe-area inset instead of eating into 52px', () => {
	assert.match(css, /\.shell\.svelte-[\w-]+ \{ --shell-header-h: calc\(var\(--header-h\) \+ var\(--safe-top\)\);/);
	assert.match(css, /\.shell-header\.svelte-[\w-]+ \{[^}]*height: var\(--shell-header-h\);[^}]*padding-top: var\(--safe-top\);/);
});

test('drawer slide reads motion tokens and the resize handle draws the kit focus ring inset', () => {
	assert.match(css, /\.shell-sidebar\.svelte-[\w-]+ \{[^}]*transition: translate var\(--dur-exit-slow\) var\(--ease-drawer\);/);
	assert.match(css, /\.shell-sidebar\.open\.svelte-[\w-]+ \{[^}]*transition-duration: var\(--dur-sheet\);/);
	assert.doesNotMatch(css, /prefers-reduced-motion/);
	assert.match(
		css,
		/.shell-sidebar-resize\.svelte-[\w-]+:focus-visible \{ outline: var\(--focus-ring\); outline-offset: var\(--focus-ring-offset-inset\);/
	);
});
