import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { HOVER_CLOSE_GRACE } from '../src/lib/components/molecules/popover-hover.js';

const bundle = await buildFixture('mount-popover-tooltip-filter.js');
const OPEN = 'data-popover-open';
/** @param {number} ms */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** @param {import('jsdom').DOMWindow} win */
function polyfillPopover(win) {
	const proto = win.HTMLElement.prototype;
	proto.scrollIntoView = () => {};
	const matches = proto.matches;
	proto.matches = function (sel) {
		if (sel === ':popover-open') return this.hasAttribute(OPEN);
		return matches.call(this, sel);
	};
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
	win.document.addEventListener('click', (e) => {
		const invoker = /** @type {Element} */ (e.target).closest('[popovertarget]');
		const target = invoker && win.document.getElementById(invoker.getAttribute('popovertarget') ?? '');
		if (!target) return;
		if (target.hasAttribute(OPEN)) target.hidePopover();
		else target.showPopover();
	});
}

/** Track window scroll/resize listeners so a leak after unmount is observable.
 * @param {any} win */
function trackWindowListeners(win) {
	/** @type {Set<string>} */
	const live = new Set();
	const add = win.addEventListener.bind(win);
	const remove = win.removeEventListener.bind(win);
	/** @type {(type: string, fn: any, opts?: any) => void} */
	win.addEventListener = (type, fn, opts) => {
		if (type === 'scroll' || type === 'resize') live.add(type);
		add(type, fn, opts);
	};
	/** @type {(type: string, fn: any, opts?: any) => void} */
	win.removeEventListener = (type, fn, opts) => {
		if (type === 'scroll' || type === 'resize') live.delete(type);
		remove(type, fn, opts);
	};
	return live;
}

/** @param {Record<string, boolean>} props */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const win = dom.window;
	polyfillPopover(win);
	const live = trackWindowListeners(win);
	win.eval(bundle);
	const { mount, unmount, flushSync, Fixture } = win.__fixture;
	const app = mount(Fixture, { target: win.document.body, props });
	flushSync();
	const doc = win.document;
	/** @param {Element} el @param {string} type @param {string} pointerType */
	const pointer = (el, type, pointerType) => {
		const ev = new win.Event(type, { bubbles: false });
		Object.defineProperty(ev, 'pointerType', { value: pointerType });
		el.dispatchEvent(ev);
	};
	return { win, doc, live, flush: flushSync, pointer, unmount: () => unmount(app) };
}

const panelOf = (/** @type {Document} */ doc) => /** @type {HTMLElement} */ (doc.querySelector('.pop-panel'));
const triggerOf = (/** @type {Document} */ doc) => /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="Popover"]'));

test('Popover openOn=hover: a touch tap (pointerleave before click) opens and stays open', async () => {
	const { doc, flush, pointer } = render({ showTooltip: false, showFilter: false });
	const trigger = triggerOf(doc);
	pointer(trigger, 'pointerenter', 'touch');
	pointer(trigger, 'pointerleave', 'touch');
	trigger.click();
	flush();
	assert.ok(panelOf(doc).hasAttribute(OPEN), 'tap opens the panel');
	await wait(HOVER_CLOSE_GRACE + 40);
	flush();
	assert.ok(panelOf(doc).hasAttribute(OPEN), 'still open after the close grace');
	pointer(panelOf(doc), 'pointerleave', 'touch');
	await wait(HOVER_CLOSE_GRACE + 40);
	assert.ok(panelOf(doc).hasAttribute(OPEN), 'a touch leaving the panel does not close it');
});

test('Popover openOn=hover: a mouse leaving the trigger still closes after the grace', async () => {
	const { doc, flush, pointer } = render({ showTooltip: false, showFilter: false });
	const trigger = triggerOf(doc);
	trigger.click();
	flush();
	assert.ok(panelOf(doc).hasAttribute(OPEN));
	pointer(trigger, 'pointerleave', 'mouse');
	await wait(HOVER_CLOSE_GRACE + 40);
	assert.equal(panelOf(doc).hasAttribute(OPEN), false);
});

test('Popover unmounted while open removes its window scroll/resize listeners', async () => {
	const { doc, flush, live, unmount } = render({ showTooltip: false, showFilter: false });
	triggerOf(doc).click();
	flush();
	await wait(0);
	assert.deepEqual([...live].sort(), ['resize', 'scroll'], 'listeners attached while open');
	unmount();
	assert.equal(live.size, 0);
});

test('Tooltip appends to an existing aria-describedby and gives it back on unmount', async () => {
	const { doc, flush, unmount } = render({ showPopover: false, showFilter: false });
	const btn = /** @type {HTMLElement} */ (doc.getElementById('tip-btn'));
	const tip = /** @type {HTMLElement} */ (doc.querySelector('[role="tooltip"]'));
	assert.equal(btn.getAttribute('aria-describedby'), `hint ${tip.id}`);
	unmount();
	flush();
	assert.equal(btn.getAttribute('aria-describedby'), 'hint');
});

test('Tooltip: Escape on the document dismisses a hover-opened bubble', async () => {
	const { win, doc, flush } = render({ showPopover: false, showFilter: false });
	const wrap = /** @type {HTMLElement} */ (doc.querySelector('.tip-wrap'));
	const tip = /** @type {HTMLElement} */ (doc.querySelector('[role="tooltip"]'));
	wrap.dispatchEvent(new win.Event('mouseenter'));
	await wait(5);
	flush();
	assert.ok(tip.hasAttribute(OPEN), 'hover opened it');
	doc.body.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
	assert.equal(tip.hasAttribute(OPEN), false);
});

test('Tooltip unmounted while showing removes window and document listeners', async () => {
	const { win, doc, live, flush, unmount } = render({ showPopover: false, showFilter: false });
	const wrap = /** @type {HTMLElement} */ (doc.querySelector('.tip-wrap'));
	wrap.dispatchEvent(new win.Event('mouseenter'));
	await wait(5);
	flush();
	assert.deepEqual([...live].sort(), ['resize', 'scroll']);
	unmount();
	assert.equal(live.size, 0);
});

async function openSuggestions() {
	const ui = render({ showPopover: false, showTooltip: false });
	const input = /** @type {HTMLInputElement} */ (ui.doc.querySelector('input.fi__input'));
	input.focus();
	await wait(0);
	ui.flush();
	/** @param {string} key */
	const press = (key) => {
		input.dispatchEvent(new ui.win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
		ui.flush();
	};
	return { ...ui, input, press, listbox: () => ui.doc.querySelector('[role="listbox"]') };
}

test('FilterInput input is a combobox wired to the suggestion listbox', async () => {
	const { input, listbox } = await openSuggestions();
	const lb = listbox();
	assert.ok(lb, 'focus opens field suggestions');
	assert.equal(input.getAttribute('role'), 'combobox');
	assert.equal(input.getAttribute('aria-autocomplete'), 'list');
	assert.equal(input.getAttribute('aria-expanded'), 'true');
	assert.equal(input.getAttribute('aria-controls'), lb.id);
	assert.ok(lb.id, 'listbox has an id');
	const opts = [...lb.querySelectorAll('[role="option"]')];
	assert.equal(opts.length, 2);
	for (const o of opts) {
		assert.ok(o.id, 'option has an id');
		assert.equal(o.getAttribute('tabindex'), '-1');
	}
	assert.equal(input.getAttribute('aria-activedescendant'), opts[0].id);
	assert.equal(opts[0].getAttribute('aria-selected'), 'true');
});

test('FilterInput arrows move aria-activedescendant, Escape collapses, Enter still accepts', async () => {
	const { input, press, listbox } = await openSuggestions();
	const opts = [.../** @type {Element} */ (listbox()).querySelectorAll('[role="option"]')];
	press('ArrowDown');
	assert.equal(input.getAttribute('aria-activedescendant'), opts[1].id);
	assert.equal(opts[1].getAttribute('aria-selected'), 'true');
	press('Escape');
	assert.equal(listbox(), null);
	assert.equal(input.getAttribute('aria-expanded'), 'false');
	assert.equal(input.hasAttribute('aria-controls'), false);
	assert.equal(input.hasAttribute('aria-activedescendant'), false);
	input.click();
	await wait(0);
	press('ArrowDown');
	press('Enter');
	await wait(0);
	assert.match(input.value, /^year/);
});
