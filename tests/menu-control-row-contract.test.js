import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-menu-control.js');
const OPEN = 'data-popover-open';
const settle = () => new Promise((r) => setTimeout(r, 0));

/** @param {import('jsdom').DOMWindow} win */
function polyfillPopover(win) {
	const proto = win.HTMLElement.prototype;
	proto.showPopover = function () {
		if (this.hasAttribute(OPEN)) return;
		this.setAttribute(OPEN, '');
		this.dispatchEvent(Object.assign(new win.Event('toggle'), { oldState: 'closed', newState: 'open' }));
	};
	proto.hidePopover = function () {
		if (!this.hasAttribute(OPEN)) return;
		this.removeAttribute(OPEN);
		this.dispatchEvent(Object.assign(new win.Event('toggle'), { oldState: 'open', newState: 'closed' }));
	};
	// jsdom does not implement popovertarget invocation.
	win.document.addEventListener('click', (e) => {
		const invoker = /** @type {Element} */ (e.target).closest('[popovertarget]');
		const target = invoker && win.document.getElementById(invoker.getAttribute('popovertarget') ?? '');
		if (!target) return;
		if (target.hasAttribute(OPEN)) target.hidePopover();
		else target.showPopover();
	});
}

async function openMenu() {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
	polyfillPopover(dom.window);
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	mount(Fixture, { target: dom.window.document.body });
	flushSync();
	const doc = dom.window.document;
	/** @type {HTMLElement} */ (doc.querySelector('[popovertarget]')).click();
	flushSync();
	await settle();
	flushSync();
	const list = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="Menu"]'));
	/** @param {string} key */
	const press = (key) => {
		const ev = new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
		(doc.activeElement ?? list).dispatchEvent(ev);
		flushSync();
		return ev;
	};
	return { win: dom.window, doc, list, press, flush: flushSync };
}

test('a control row is a non-button row with the menu row chrome', async () => {
	const { list } = await openMenu();
	const rows = list.querySelectorAll(':scope > .menu-row');
	assert.equal(rows.length, 3);
	for (const row of rows) {
		assert.equal(row.tagName, 'DIV');
		assert.equal(row.getAttribute('role'), 'none');
		assert.ok(row.classList.contains('menu-item'), 'shares the row padding/height class');
		assert.equal(row.closest('button'), null);
		assert.ok(row.querySelector('svg'), 'icon sits in the leading column');
	}
	assert.equal(list.querySelectorAll('button select, button button').length, 0, 'no interactive content inside a button');
	assert.equal(list.querySelectorAll(':scope > [role="menuitem"]').length, 2);
});

test('↑/↓ move through plain items, the select and the nested popover trigger, skipping a disabled row', async () => {
	const { doc, press } = await openMenu();
	const order = () => {
		const el = /** @type {HTMLElement} */ (doc.activeElement);
		return el.tagName === 'SELECT' ? 'select' : el.hasAttribute('popovertarget') ? 'popover' : el.textContent?.trim();
	};
	assert.equal(order(), 'View');
	const seen = [];
	for (let n = 0; n < 4; n++) {
		const ev = press('ArrowDown');
		assert.ok(ev.defaultPrevented, 'the menu owns ↓, a closed select does not change value');
		seen.push(order());
	}
	assert.deepEqual(seen, ['select', 'popover', 'Select multiple', 'View']);
	press('ArrowUp');
	assert.equal(order(), 'Select multiple');
	press('Home');
	press('ArrowDown');
	assert.equal(order(), 'select');
	assert.ok(doc.querySelectorAll('.menu-row[inert]').length === 1);
});

test('the hosted select works natively and the menu stays open', async () => {
	const { win, doc, flush } = await openMenu();
	const select = /** @type {HTMLSelectElement} */ (doc.querySelector('.menu-row select'));
	select.value = 'repo';
	select.dispatchEvent(new win.Event('change', { bubbles: true }));
	flush();
	assert.equal(doc.querySelector('#group')?.textContent, 'repo');
	assert.ok(doc.querySelector('[role="menu"]')?.hasAttribute(OPEN));
	assert.equal(doc.querySelector('#picked')?.textContent, '');
});

test('keys inside a nested popover stay with it; its close() closes the outer menu', async () => {
	const { doc, press, flush } = await openMenu();
	const nestedTrigger = /** @type {HTMLElement} */ (doc.querySelector('.menu-row [popovertarget]'));
	nestedTrigger.click();
	flush();
	await settle();
	flush();
	const done = /** @type {HTMLElement} */ (doc.querySelector('#nested-done'));
	done.focus();
	const ev = press('ArrowDown');
	assert.ok(!ev.defaultPrevented);
	assert.equal(doc.activeElement, done);
	done.click();
	flush();
	assert.ok(!doc.querySelector('[role="menu"]')?.hasAttribute(OPEN));
});
