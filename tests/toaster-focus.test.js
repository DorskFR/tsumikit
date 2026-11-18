import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const source = await readFile(new URL('../src/lib/components/molecules/Toaster.svelte', import.meta.url), 'utf8');
const bundle = await buildFixture('mount-toaster-focus.svelte.js');

/** @param {Record<string, unknown>} [props] */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body><button id="outside">outside</button></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const w = dom.window;
	w.PointerEvent = class PointerEvent extends w.MouseEvent {
		/** @param {string} type @param {PointerEventInit} [init] */
		constructor(type, init = {}) {
			super(type, init);
			this.pointerId = init.pointerId ?? 1;
			this.pointerType = init.pointerType ?? 'mouse';
		}
	};
	w.HTMLElement.prototype.showPopover = () => {};
	w.HTMLElement.prototype.hidePopover = () => {};
	w.eval(bundle);
	const { mount, flushSync, Toaster, toasts } = w.__fixture;
	const doc = w.document;
	const host = doc.createElement('div');
	doc.body.append(host);
	mount(Toaster, { target: host, props });
	flushSync();
	/** @type {string[]} */
	const calls = [];
	const { pause, resume } = toasts;
	toasts.pause = (/** @type {number} */ id) => (calls.push(`pause ${id}`), pause.call(toasts, id));
	toasts.resume = (/** @type {number} */ id) => (calls.push(`resume ${id}`), resume.call(toasts, id));
	/** @param {string} message @param {Record<string, unknown>} [opts] @returns {number} */
	const show = (message, opts = {}) => {
		const id = toasts.show(message, { duration: 60_000, ...opts });
		flushSync();
		return id;
	};
	const cards = () => /** @type {HTMLElement[]} */ ([...doc.querySelectorAll('.toast')]);
	/** @param {HTMLElement} el */
	const focus = (el) => {
		el.focus();
		flushSync();
	};
	/** @param {Element} el @param {string} type */
	const pointer = (el, type) => {
		el.dispatchEvent(new w.PointerEvent(type, { pointerType: 'mouse' }));
		flushSync();
	};
	const outside = /** @type {HTMLElement} */ (doc.getElementById('outside'));
	const cleanup = () => {
		for (const t of [...toasts.items]) toasts.remove(t.id);
		flushSync();
	};
	return { w, doc, toasts, calls, show, cards, focus, pointer, outside, flush: flushSync, cleanup };
}

test('focus entering a toast pauses its timer; leaving the toast resumes it', () => {
	const r = render();
	const id = r.show('saved');
	r.focus(r.outside);
	r.focus(r.cards()[0]);
	assert.deepEqual(r.calls, [`pause ${id}`]);
	r.focus(r.outside);
	assert.deepEqual(r.calls, [`pause ${id}`, `resume ${id}`]);
	r.cleanup();
});

test('moving focus between controls of the same toast keeps it paused', () => {
	const r = render();
	const id = r.show('deleted', { action: { label: 'Undo', run: () => {} } });
	const [card] = r.cards();
	const text = /** @type {HTMLElement} */ (card.querySelector('.toast-text'));
	const action = /** @type {HTMLElement} */ (card.querySelector('button:not(.toast-text)'));
	r.focus(text);
	r.focus(action);
	r.focus(text);
	assert.deepEqual(r.calls, [`pause ${id}`]);
	r.focus(r.outside);
	assert.deepEqual(r.calls, [`pause ${id}`, `resume ${id}`]);
	r.cleanup();
});

test('hover and focus together hold the timer until both end, in either order', () => {
	for (const order of [['blur', 'leave'], ['leave', 'blur']]) {
		const r = render();
		const id = r.show('saved');
		const [card] = r.cards();
		r.pointer(card, 'pointerenter');
		r.focus(card);
		assert.deepEqual(r.calls, [`pause ${id}`]);
		for (const step of order) {
			if (step === 'blur') r.focus(r.outside);
			else r.pointer(card, 'pointerleave');
			if (step === order[0]) assert.deepEqual(r.calls, [`pause ${id}`], `still paused after ${step}`);
		}
		assert.deepEqual(r.calls, [`pause ${id}`, `resume ${id}`]);
		r.cleanup();
	}
});

test('both live regions sit inside one region named by the label prop', () => {
	for (const [props, name] of /** @type {[Record<string, unknown>, string][]} */ ([
		[{}, 'Notifications'],
		[{ label: 'Alerts' }, 'Alerts']
	])) {
		const r = render(props);
		const region = r.doc.querySelector('[data-tsu="Toaster"]');
		assert.equal(region?.tagName, 'SECTION');
		assert.equal(region?.getAttribute('aria-label'), name);
		assert.equal(region?.getAttribute('popover'), 'manual');
		assert.ok(region?.querySelector('[role="status"][aria-live="polite"]'));
		assert.ok(region?.querySelector('[role="alert"][aria-live="assertive"]'));
	}
	assert.match(source, /label = 'Notifications'/);
});

test('dismissing the focused toast returns focus to where it came from', () => {
	const r = render();
	r.show('first');
	r.show('second');
	r.focus(r.outside);
	const [first] = r.cards();
	r.focus(first);
	first.click();
	r.flush();
	assert.equal(r.doc.activeElement, r.outside);
	r.cleanup();
});

test('with nowhere to return to, focus moves to the next toast instead of <body>', () => {
	const r = render();
	const a = r.show('first');
	const b = r.show('second', { action: { label: 'Undo', run: () => {} } });
	const [first, second] = r.cards();
	r.focus(first);
	r.toasts.remove(a);
	r.flush();
	assert.equal(r.doc.activeElement, second.querySelector('.toast-text'));
	assert.deepEqual(r.calls.at(-1), `pause ${b}`, 'the toast now focused holds its timer');
	r.cleanup();
});

test('dismissing an unfocused toast leaves focus alone', () => {
	const r = render();
	const a = r.show('first');
	r.show('second');
	r.focus(r.cards()[1]);
	r.toasts.dismiss(a);
	r.flush();
	assert.equal(r.doc.activeElement, r.cards()[1]);
	r.cleanup();
});
