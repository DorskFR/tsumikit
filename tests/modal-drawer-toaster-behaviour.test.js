import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const read = (/** @type {string} */ f) =>
	readFile(new URL(`../src/lib/components/molecules/${f}`, import.meta.url), 'utf8');
const [modal, drawer, toaster] = await Promise.all([
	read('Modal.svelte'),
	read('Drawer.svelte'),
	read('Toaster.svelte')
]);
const bundle = await buildFixture('mount-modal-drawer-toaster.svelte.js');

/**
 * jsdom has no <dialog> modality or Popover API: model `open` + `:modal` and
 * record show/hide calls so the top-layer bookkeeping can be asserted.
 * @param {Record<string, unknown>} init
 */
function render(init = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const w = dom.window;
	if (typeof w.PointerEvent !== 'function') {
		w.PointerEvent = class PointerEvent extends w.MouseEvent {
			/** @param {string} type @param {PointerEventInit} [init] */
			constructor(type, init = {}) {
				super(type, init);
				this.pointerId = init.pointerId ?? 1;
			}
		};
	}
	const modals = new WeakSet();
	w.HTMLDialogElement.prototype.showModal = function () {
		this.setAttribute('open', '');
		modals.add(this);
	};
	w.HTMLDialogElement.prototype.close = function () {
		this.removeAttribute('open');
		modals.delete(this);
		this.dispatchEvent(new w.Event('close'));
	};
	const matches = w.Element.prototype.matches;
	w.Element.prototype.matches = function (/** @type {string} */ sel) {
		if (sel === ':modal') return modals.has(this);
		return matches.call(this, sel);
	};
	/** @type {string[]} */
	const popover = [];
	w.HTMLElement.prototype.showPopover = function () {
		popover.push('show');
		this.dataset.open = '';
	};
	w.HTMLElement.prototype.hidePopover = function () {
		popover.push('hide');
		delete this.dataset.open;
	};
	w.eval(bundle);
	const { mount, unmount, flushSync, Fixture, props, toasts } = w.__fixture;
	const live = props({ closed: [], ...init });
	const app = mount(Fixture, { target: w.document.body, props: live });
	flushSync();
	const doc = w.document;
	const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (doc.querySelector(s));
	const fire = (/** @type {Element} */ el, /** @type {string} */ type) => {
		const Ctor = type.startsWith('pointer') ? w.PointerEvent : w.MouseEvent;
		el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, button: 0 }));
		flushSync();
	};
	const settle = () => new Promise((r) => setTimeout(r, 0));
	return {
		w,
		doc,
		q,
		fire,
		popover,
		toasts,
		props: live,
		flush: flushSync,
		settle,
		destroy: () => {
			unmount(app);
			flushSync();
		}
	};
}

for (const [name, tsu, part] of [
	['Modal', 'Modal', 'modal-body'],
	['Drawer', 'Drawer', 'drawer-body']
]) {
	const key = name === 'Modal' ? 'modalOpen' : 'drawerOpen';
	const tag = name.toLowerCase();

	test(`${name}: a press and release both on the backdrop closes`, () => {
		const r = render({ [key]: true });
		const dialog = r.q(`dialog[data-tsu="${tsu}"]`);
		assert.ok(dialog.hasAttribute('open'));
		r.fire(dialog, 'pointerdown');
		r.fire(dialog, 'click');
		assert.deepEqual(r.props.closed, [tag]);
		assert.equal(r.props[key], false);
		r.destroy();
	});

	test(`${name}: a drag that starts inside and is released on the backdrop stays open`, () => {
		const r = render({ [key]: true });
		const dialog = r.q(`dialog[data-tsu="${tsu}"]`);
		r.fire(r.q(`[data-part="${part}"]`), 'pointerdown');
		r.fire(dialog, 'click');
		assert.deepEqual(r.props.closed, []);
		assert.equal(r.props[key], true);
		r.fire(dialog, 'pointerdown');
		r.fire(dialog, 'click');
		assert.deepEqual(r.props.closed, [tag], 'a later genuine backdrop click still closes');
		r.destroy();
	});

	test(`${name}: a press on the backdrop released inside the sheet stays open`, () => {
		const r = render({ [key]: true });
		const dialog = r.q(`dialog[data-tsu="${tsu}"]`);
		r.fire(dialog, 'pointerdown');
		r.fire(r.q(`[data-part="${part}"]`), 'click');
		assert.deepEqual(r.props.closed, []);
		r.destroy();
	});
}

test('Modal and Drawer disable the sheet and backdrop animations under prefers-reduced-motion', () => {
	assert.match(modal, /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.modal::backdrop,\s*\.sheet\s*{\s*animation: none;/s);
	assert.match(drawer, /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.drawer::backdrop,\s*\.panel\s*{\s*animation: none;/s);
	assert.match(toaster, /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.toaster :global\(\.toast\)\s*{\s*animation: none;/s);
});

test('Toaster: with no modal open the stack stays in its host and the popover is shown once per queue', () => {
	const r = render();
	const stack = r.q('[data-tsu="Toaster"]');
	assert.ok(stack.parentElement?.classList.contains('toaster-host'));
	assert.deepEqual(r.popover, []);
	r.toasts.show('hello', { duration: 0 });
	r.flush();
	assert.deepEqual(r.popover, ['show']);
	assert.ok(stack.parentElement?.classList.contains('toaster-host'));
	r.toasts.dismiss(1);
	r.flush();
	assert.deepEqual(r.popover, ['show', 'hide']);
	r.destroy();
});

test('Toaster: a toast pushed while a Modal is open renders inside that dialog and moves home when it closes', async () => {
	const r = render({ modalOpen: true });
	const stack = r.q('[data-tsu="Toaster"]');
	const dialog = r.q('dialog[data-tsu="Modal"]');
	r.toasts.show('saved', { duration: 0, action: { label: 'Undo', run() {} } });
	r.flush();
	assert.equal(stack.parentElement, dialog, 'stack lives in the open modal dialog');
	assert.ok(stack.querySelector('button'), 'action button rendered inside the dialog');
	assert.ok(dialog.contains(r.q('[role="status"]')), 'live region is inside the dialog');
	assert.deepEqual(r.popover, ['show']);
	r.props.modalOpen = false;
	r.flush();
	await r.settle();
	assert.ok(stack.parentElement?.classList.contains('toaster-host'), 'back in the host after close');
	assert.deepEqual(r.popover, ['show', 'hide', 'show'], 'hidden before the move home, shown again after');
	r.destroy();
});

test('Toaster: a toast already showing moves into a Modal/Drawer when one opens, and follows the topmost one', async () => {
	const r = render();
	const stack = r.q('[data-tsu="Toaster"]');
	r.toasts.show('hello', { duration: 0 });
	r.flush();
	assert.ok(stack.parentElement?.classList.contains('toaster-host'));
	r.props.drawerOpen = true;
	r.flush();
	await r.settle();
	assert.equal(stack.parentElement, r.q('dialog[data-tsu="Drawer"]'));
	r.props.modalOpen = true;
	r.flush();
	await r.settle();
	assert.equal(stack.parentElement, r.q('dialog[data-tsu="Drawer"]'), 'later dialog in DOM order wins');
	r.props.drawerOpen = false;
	r.flush();
	await r.settle();
	assert.equal(stack.parentElement, r.q('dialog[data-tsu="Modal"]'));
	r.props.modalOpen = false;
	r.flush();
	await r.settle();
	assert.ok(stack.parentElement?.classList.contains('toaster-host'));
	r.destroy();
});

test('Toaster: a toast pushed while in a dialog does not re-insert the stack (no animation restart)', () => {
	const r = render({ modalOpen: true });
	const stack = r.q('[data-tsu="Toaster"]');
	r.toasts.show('one', { duration: 0 });
	r.flush();
	assert.deepEqual(r.popover, ['show']);
	r.toasts.show('two', { duration: 0 });
	r.flush();
	assert.deepEqual(r.popover, ['show', 'show']);
	assert.equal(stack.querySelectorAll('.toast').length, 2);
	r.destroy();
});

test('Toaster: unmounting while portaled removes the stack from the document', () => {
	const r = render({ modalOpen: true });
	r.toasts.show('hello', { duration: 0 });
	r.flush();
	assert.ok(r.q('dialog[data-tsu="Modal"] [data-tsu="Toaster"]'));
	r.props.toaster = false;
	r.flush();
	assert.equal(r.q('[data-tsu="Toaster"]'), null);
	assert.equal(r.q('.toaster-host'), null);
	r.toasts.dismiss(1);
	r.destroy();
});
