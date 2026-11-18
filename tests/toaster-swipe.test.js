import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const [source, reset] = await Promise.all([
	readFile(new URL('../src/lib/components/molecules/Toaster.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/styles/reset.css', import.meta.url), 'utf8')
]);
const css = source.slice(source.indexOf('<style>'));
const bundle = await buildFixture('mount-modal-drawer-toaster.svelte.js');

function render() {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const w = dom.window;
	w.PointerEvent = class PointerEvent extends w.MouseEvent {
		/** @param {string} type @param {PointerEventInit} [init] */
		constructor(type, init = {}) {
			super(type, init);
			this.pointerId = init.pointerId ?? 1;
			this.pointerType = init.pointerType ?? 'touch';
		}
	};
	/** @type {number[]} */
	const captured = [];
	w.Element.prototype.setPointerCapture = function (/** @type {number} */ id) {
		captured.push(id);
	};
	w.HTMLElement.prototype.showPopover = () => {};
	w.HTMLElement.prototype.hidePopover = () => {};
	w.eval(bundle);
	const { mount, flushSync, Fixture, props, toasts } = w.__fixture;
	mount(Fixture, { target: w.document.body, props: props({ closed: [] }) });
	flushSync();
	const doc = w.document;
	const card = () => /** @type {HTMLElement} */ (doc.querySelector('.toast'));
	/** @param {Element} el @param {string} type @param {number} x @param {number} y @param {string} [pointerType] */
	const pointer = (el, type, x, y, pointerType = 'touch') => {
		el.dispatchEvent(new w.PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 3, pointerType, clientX: x, clientY: y }));
		flushSync();
	};
	/** @param {Element} el @param {[number, number][]} points @param {string} [type] */
	const drag = (el, points, type) => {
		pointer(el, 'pointerdown', 100, 50, type);
		for (const [x, y] of points) pointer(el, 'pointermove', x, y, type);
		const [x, y] = points[points.length - 1];
		pointer(el, 'pointerup', x, y, type);
	};
	/** @param {Element} el */
	const click = (el) => {
		el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
		flushSync();
	};
	const leaving = () => [...toasts.items].map((/** @type {{ leaving: boolean }} */ t) => t.leaving);
	return { w, doc, card, pointer, drag, click, captured, toasts, leaving, flush: flushSync };
}

test('a touch swipe past the threshold dismisses, either direction', () => {
	for (const end of [100 - 60, 100 + 60]) {
		const r = render();
		r.toasts.show('saved', { duration: 0 });
		r.flush();
		const el = r.card();
		r.pointer(el, 'pointerdown', 100, 50);
		r.pointer(el, 'pointermove', end > 100 ? 112 : 88, 50);
		assert.ok(el.hasAttribute('data-swiping'));
		assert.deepEqual(r.captured, [3]);
		r.pointer(el, 'pointermove', end, 51);
		assert.equal(el.style.translate, `${end - 100}px 0`);
		assert.deepEqual(r.leaving(), [false]);
		r.pointer(el, 'pointerup', end, 51);
		assert.deepEqual(r.leaving(), [true]);
		assert.ok(!el.hasAttribute('data-swiping'));
		assert.match(el.style.translate, /var\(--shift-md\)/);
	}
});

test('a short drag snaps back and keeps the toast', () => {
	const r = render();
	r.toasts.show('saved', { duration: 0 });
	r.flush();
	const el = r.card();
	r.drag(el, [[88, 50], [70, 50]]);
	assert.deepEqual(r.leaving(), [false]);
	assert.equal(el.style.translate, '');
	assert.ok(!el.hasAttribute('data-swiping'));
});

test('a cancelled swipe (the browser took the scroll) snaps back', () => {
	const r = render();
	r.toasts.show('saved', { duration: 0 });
	r.flush();
	const el = r.card();
	r.pointer(el, 'pointerdown', 100, 50);
	r.pointer(el, 'pointermove', 20, 50);
	r.pointer(el, 'pointercancel', 20, 50);
	assert.deepEqual(r.leaving(), [false]);
	assert.equal(el.style.translate, '');
});

test('a vertical drag is left to the scroller', () => {
	const r = render();
	r.toasts.show('saved', { duration: 0 });
	r.flush();
	const el = r.card();
	r.drag(el, [[102, 70], [30, 200]]);
	assert.deepEqual(r.leaving(), [false]);
	assert.equal(el.style.translate, '');
	assert.deepEqual(r.captured, []);
});

test('a mouse drag does nothing', () => {
	const r = render();
	r.toasts.show('saved', { duration: 0 });
	r.flush();
	const el = r.card();
	r.drag(el, [[80, 50], [-100, 50]], 'mouse');
	assert.deepEqual(r.leaving(), [false]);
	assert.equal(el.style.translate, '');
	assert.deepEqual(r.captured, []);
});

test('tapping the action runs it; a swipe started on it dismisses without running it', async () => {
	const r = render();
	let runs = 0;
	r.toasts.show('deleted', { duration: 0, action: { label: 'Undo', run: () => void runs++ } });
	r.flush();
	const button = /** @type {HTMLElement} */ (r.card().querySelector('button:not(.toast-text)'));
	r.pointer(button, 'pointerdown', 100, 50);
	r.pointer(button, 'pointerup', 101, 50);
	r.click(button);
	assert.equal(runs, 1, 'a tap still runs the action');

	r.toasts.show('archived', { duration: 0, action: { label: 'Undo', run: () => void runs++ } });
	r.flush();
	const second = /** @type {HTMLElement} */ ([...r.doc.querySelectorAll('.toast')].at(-1));
	const action = /** @type {HTMLElement} */ (second.querySelector('button:not(.toast-text)'));
	r.drag(action, [[110, 50], [180, 52]]);
	r.click(action);
	await new Promise((res) => setTimeout(res, 0));
	assert.equal(runs, 1, 'the swipe did not run the action');
	assert.equal(r.toasts.items.at(-1).leaving, true);
});

test('a swipe holds the auto-dismiss timer and a snap-back restarts it', () => {
	const r = render();
	const id = r.toasts.show('saved', { duration: 60_000 });
	r.flush();
	const el = r.card();
	const calls = /** @type {string[]} */ ([]);
	const { pause, resume } = r.toasts;
	r.toasts.pause = (/** @type {number} */ x) => (calls.push(`pause ${x}`), pause.call(r.toasts, x));
	r.toasts.resume = (/** @type {number} */ x) => (calls.push(`resume ${x}`), resume.call(r.toasts, x));
	r.drag(el, [[90, 50], [80, 50]]);
	assert.deepEqual(calls, [`pause ${id}`, `resume ${id}`]);
	r.toasts.remove(id);
});

test('touch-action keeps vertical scroll; reduced motion strips the slide via reset.css tokens', () => {
	assert.match(css, /\.toaster :global\(\.toast\)\s*{[^}]*touch-action: pan-y;/);
	assert.match(css, /\.toaster :global\(\.toast\[data-swiping\]\)\s*{\s*transition: none;/);
	assert.match(source, /e\.pointerType !== 'touch'/);
	assert.match(reset, /--shift-md: 0px;/);
	assert.match(reset, /transition-property: opacity,(?![^;]*translate)[^;]*!important;/);
});
