import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const source = await readFile(
	new URL('../src/lib/components/layouts/AppShell.svelte', import.meta.url),
	'utf8'
);
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const bundle = await buildFixture('mount-app-shell.svelte.js');

/** @param {Record<string, unknown>} init @param {{ mobile?: boolean }} opts */
function render(init = {}, { mobile = true } = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		url: 'https://app.test/',
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	/** @type {Set<() => void>} */
	const listeners = new Set();
	const mq = {
		matches: mobile,
		addEventListener: (/** @type {string} */ _t, /** @type {() => void} */ fn) => listeners.add(fn),
		removeEventListener: (/** @type {string} */ _t, /** @type {() => void} */ fn) => listeners.delete(fn)
	};
	dom.window.matchMedia = /** @type {any} */ (() => mq);
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture, props } = dom.window.__fixture;
	const live = props({ open: false, changes: [], ...init });
	mount(Fixture, { target: dom.window.document.body, props: live });
	flushSync();
	const doc = dom.window.document;
	const q = (/** @type {string} */ sel) => /** @type {HTMLElement} */ (doc.querySelector(sel));
	const state = () => ({
		asideOpen: q('aside.shell-sidebar').classList.contains('open'),
		expanded: q('button[aria-label="Toggle navigation"]').getAttribute('aria-expanded'),
		scrim: q('.shell-scrim').classList.contains('show'),
		mainInert: Boolean(/** @type {any} */ (q('main.shell-main')).inert) || q('main.shell-main').hasAttribute('inert'),
		bodyOverflow: doc.body.style.overflow
	});
	const click = (/** @type {Element} */ el, /** @type {MouseEventInit} */ init = {}) => {
		el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init }));
		flushSync();
	};
	const toggle = () => click(q('button[aria-label="Toggle navigation"]'));
	const link = (/** @type {string} */ name) => q(`[data-test="${name}"]`);
	const setMobile = (/** @type {boolean} */ next) => {
		mq.matches = next;
		for (const fn of listeners) fn();
		flushSync();
	};
	return { dom, doc, q, state, click, toggle, link, setMobile, props: live, flush: flushSync };
}

const CLOSED = { asideOpen: false, expanded: 'false', scrim: false, mainInert: false, bodyOverflow: '' };
const OPEN = { asideOpen: true, expanded: 'true', scrim: true, mainInert: true, bodyOverflow: 'hidden' };

test('the hamburger opens the mobile drawer and reports it through onOpenChange and bind:open', () => {
	const r = render();
	assert.deepEqual(r.state(), CLOSED);
	r.toggle();
	assert.deepEqual(r.state(), OPEN);
	assert.equal(r.props.open, true);
	assert.deepEqual([...r.props.changes], [true]);
});

test('clicking a same-origin link inside the drawer closes it', () => {
	const r = render();
	r.toggle();
	r.click(r.q('[data-test="local"] span'));
	assert.deepEqual(r.state(), CLOSED);
	assert.equal(r.props.open, false);
	assert.deepEqual([...r.props.changes], [true, false]);

	r.toggle();
	r.click(r.link('hash'));
	assert.deepEqual(r.state(), CLOSED);
});

test('external, download, target=_blank, modified and non-link clicks leave the drawer open', () => {
	const r = render();
	r.toggle();
	for (const name of ['external', 'download', 'blank', 'button']) {
		r.click(r.link(name));
		assert.deepEqual(r.state(), OPEN, name);
	}
	for (const mod of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
		r.click(r.link('local'), mod);
		assert.deepEqual(r.state(), OPEN, JSON.stringify(mod));
	}
	assert.deepEqual([...r.props.changes], [true]);
});

test('closeOnNavigate={false} keeps the drawer open after a link click', () => {
	const r = render({ closeOnNavigate: false });
	r.toggle();
	r.click(r.link('local'));
	assert.deepEqual(r.state(), OPEN);
});

test('a parent drives the drawer through bind:open', () => {
	const r = render();
	r.props.open = true;
	r.flush();
	assert.deepEqual(r.state(), OPEN);
	r.props.open = false;
	r.flush();
	assert.deepEqual(r.state(), CLOSED);
	assert.deepEqual([...r.props.changes], []);

	const initiallyOpen = render({ open: true });
	assert.deepEqual(initiallyOpen.state(), OPEN);
});

test('Escape and the scrim still close the drawer', () => {
	const r = render();
	r.toggle();
	r.dom.window.dispatchEvent(new r.dom.window.KeyboardEvent('keydown', { key: 'Escape' }));
	r.flush();
	assert.deepEqual(r.state(), CLOSED);
	r.toggle();
	r.click(r.q('.shell-scrim'));
	assert.deepEqual(r.state(), CLOSED);
	assert.deepEqual([...r.props.changes], [true, false, true, false]);
});

test('leaving the mobile breakpoint resets open to false', () => {
	const r = render();
	r.toggle();
	r.setMobile(false);
	assert.equal(r.props.open, false);
	assert.equal(r.state().asideOpen, false);
	assert.deepEqual([...r.props.changes], [true, false]);
});

test('the link listener stays framework-neutral', () => {
	assert.doesNotMatch(source, /\$app\//);
	assert.match(source, /open = \$bindable\(false\)/);
	assert.match(source, /closeOnNavigate = true/);
	assert.match(source, /onOpenChange\?: \(open: boolean\) => void;/);
});

test('README documents bind:open, onOpenChange and closeOnNavigate', () => {
	assert.match(readme, /bind:open/);
	assert.match(readme, /onOpenChange/);
	assert.match(readme, /closeOnNavigate/);
	assert.match(readme, /afterNavigate/);
});
