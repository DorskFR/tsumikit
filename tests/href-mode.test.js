import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-href-mode.js');

function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
		url: 'http://localhost/'
	});
	dom.window.HTMLElement.prototype.scrollIntoView = () => {};
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	mount(Fixture, { target: dom.window.document.body, props });
	flushSync();
	const doc = dom.window.document;
	/** @param {Element} el @param {MouseEventInit} [init] */
	const click = (el, init = {}) => {
		const e = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
		el.dispatchEvent(e);
		flushSync();
		return e.defaultPrevented;
	};
	/** @param {Element} el @param {string} k */
	const key = (el, k) => {
		el.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
		flushSync();
	};
	const settle = () => new Promise((r) => setTimeout(r, 0));
	const q = (/** @type {string} */ sel) => /** @type {HTMLElement[]} */ ([...doc.querySelectorAll(sel)]);
	return { doc, click, key, settle, q };
}

test('Tabs href: enabled tabs are anchors with aria-current, disabled tabs stay buttons, per-tab href wins', () => {
	const ui = render();
	const tabs = ui.q('[role="tab"]');
	assert.deepEqual(
		tabs.map((t) => t.tagName),
		['A', 'A', 'BUTTON', 'A']
	);
	assert.deepEqual(
		tabs.map((t) => t.getAttribute('href')),
		['?tab=overview', '?tab=logs', null, '/docs']
	);
	assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
	assert.equal(tabs[0].getAttribute('aria-current'), 'page');
	assert.equal(tabs[1].getAttribute('aria-current'), null);
	assert.equal(tabs[2].hasAttribute('disabled'), true);
	assert.deepEqual(
		tabs.map((t) => t.getAttribute('tabindex')),
		['0', '-1', '-1', '-1']
	);
});

test('Tabs href: a plain click selects, a modified click is left to the browser', () => {
	const ui = render();
	const logs = ui.q('[role="tab"]')[1];
	assert.equal(ui.click(logs, { ctrlKey: true }), false);
	assert.equal(logs.getAttribute('aria-selected'), 'false');
	assert.equal(ui.click(logs, { button: 1 }), false);
	assert.equal(ui.click(logs, { shiftKey: true }), false);
	assert.equal(ui.click(logs, { metaKey: true }), false);
	assert.equal(logs.getAttribute('aria-selected'), 'false');

	assert.equal(ui.click(logs), false);
	assert.equal(logs.getAttribute('aria-current'), 'page');
	assert.equal(ui.doc.querySelector('.probe-panel')?.textContent, 'logs');
});

test('Tabs href: the roving keyboard model survives the anchors', async () => {
	const ui = render();
	const tabs = ui.q('[role="tab"]');
	tabs[0].focus();
	ui.key(tabs[0], 'ArrowRight');
	await ui.settle();
	assert.equal(tabs[1].getAttribute('aria-current'), 'page');
	assert.equal(ui.doc.activeElement, tabs[1]);
	ui.key(tabs[1], 'ArrowRight');
	await ui.settle();
	assert.equal(ui.doc.activeElement, tabs[3], 'the disabled tab is skipped');
	ui.key(tabs[3], 'Home');
	await ui.settle();
	assert.equal(ui.doc.activeElement, tabs[0]);
});

test('SegmentedControl href: anchors with aria-current, disabled segment stays a button, modified clicks pass through', () => {
	const ui = render();
	const segs = ui.q('[role="radio"]');
	assert.deepEqual(
		segs.map((s) => s.tagName),
		['A', 'A', 'BUTTON']
	);
	assert.equal(segs[0].getAttribute('href'), '?filter=all');
	assert.equal(segs[0].getAttribute('aria-current'), 'page');
	assert.equal(segs[0].getAttribute('aria-checked'), 'true');
	assert.equal(ui.click(segs[1], { metaKey: true }), false);
	assert.equal(segs[1].getAttribute('aria-checked'), 'false');
	assert.equal(ui.click(segs[1]), false);
	assert.equal(segs[1].getAttribute('aria-current'), 'page');
	assert.equal(segs[0].getAttribute('aria-current'), null);
});

test('SegmentedControl href: arrows move selection and focus between anchors', async () => {
	const ui = render();
	const segs = ui.q('[role="radio"]');
	segs[0].focus();
	ui.key(segs[0], 'ArrowRight');
	await ui.settle();
	assert.equal(segs[1].getAttribute('aria-checked'), 'true');
	assert.equal(ui.doc.activeElement, segs[1]);
});

test('Pagination href: page links and prev/next anchors, aria-current on the current page, modified clicks pass through', () => {
	const ui = render();
	const nav = /** @type {HTMLElement} */ (ui.doc.querySelector('[data-tsu="Pagination"]'));
	const pages = /** @type {HTMLElement[]} */ ([...nav.querySelectorAll('.page')]);
	assert.ok(pages.length > 0);
	assert.ok(pages.every((p) => p.tagName === 'A'));
	const current = pages.find((p) => p.getAttribute('aria-current') === 'page');
	assert.equal(current?.textContent?.trim(), '2');
	assert.equal(current?.getAttribute('href'), '?page=2');
	const prev = /** @type {HTMLElement} */ (nav.querySelector('[aria-label="Previous page"]'));
	const next = /** @type {HTMLElement} */ (nav.querySelector('[aria-label="Next page"]'));
	assert.equal(prev.tagName, 'A');
	assert.equal(prev.getAttribute('href'), '?page=1');
	assert.equal(next.getAttribute('href'), '?page=3');

	const three = /** @type {HTMLElement} */ (pages.find((p) => p.textContent?.trim() === '3'));
	assert.equal(ui.click(three, { ctrlKey: true }), false);
	assert.equal(three.getAttribute('aria-current'), null);
	assert.equal(ui.click(three), false);
	assert.equal(three.getAttribute('aria-current'), 'page');
});

test('Pagination href: on the first page the previous link is inert', () => {
	const ui = render({ page: 1 });
	const prev = /** @type {HTMLElement} */ (ui.doc.querySelector('[aria-label="Previous page"]'));
	assert.equal(prev.getAttribute('aria-disabled'), 'true');
	assert.equal(prev.hasAttribute('href'), false);
});
