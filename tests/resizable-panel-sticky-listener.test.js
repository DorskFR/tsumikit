import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-resizable-panel-sticky.js');

/** @param {{ io?: boolean, props?: Record<string, unknown> }} [opts] */
function render({ io = true, props = {} } = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const w = /** @type {any} */ (dom.window);
	/** @type {{ cb: (entries: { isIntersecting: boolean }[]) => void, els: Set<Element>, live: boolean }[]} */
	const observers = [];
	if (io) {
		w.IntersectionObserver = class {
			/** @param {(entries: { isIntersecting: boolean }[]) => void} cb */
			constructor(cb) {
				this.o = { cb, els: new Set(), live: true };
				observers.push(this.o);
			}
			/** @param {Element} el */
			observe(el) {
				this.o.els.add(el);
			}
			disconnect() {
				this.o.live = false;
				this.o.els.clear();
			}
		};
	}
	/** @type {Set<unknown>} */
	const scroll = new Set();
	/** @type {{ capture: boolean, passive: boolean }[]} */
	const scrollOptions = [];
	const add = w.addEventListener.bind(w);
	const remove = w.removeEventListener.bind(w);
	w.addEventListener = (/** @type {string} */ type, /** @type {any} */ fn, /** @type {any} */ options) => {
		if (type === 'scroll') {
			scroll.add(fn);
			scrollOptions.push({ capture: options === true || !!options?.capture, passive: !!options?.passive });
		}
		add(type, fn, options);
	};
	w.removeEventListener = (/** @type {string} */ type, /** @type {any} */ fn, /** @type {any} */ options) => {
		if (type === 'scroll') scroll.delete(fn);
		remove(type, fn, options);
	};
	w.eval(bundle);
	const { mount, unmount, flushSync, ResizablePanel, panel } = w.__fixture;
	const app = mount(ResizablePanel, { target: w.document.body, props: { panel, ...props } });
	flushSync();
	const root = w.document.querySelector('[data-tsu="ResizablePanel"]');
	return {
		scroll,
		scrollOptions,
		observers,
		root,
		/** @param {boolean} isIntersecting */
		intersect(isIntersecting) {
			for (const o of observers) if (o.live && o.els.has(root)) o.cb([{ isIntersecting }]);
			flushSync();
		},
		destroy() {
			unmount(app);
			flushSync();
		}
	};
}

test('an off-screen panel adds no scroll listener', () => {
	const r = render();
	assert.equal(r.observers.filter((o) => o.live && o.els.has(r.root)).length, 1);
	assert.equal(r.scroll.size, 0);
	r.intersect(false);
	assert.equal(r.scroll.size, 0);
});

test('a panel listens to scroll, capture and passive, only while it intersects the viewport', () => {
	const r = render();
	r.intersect(true);
	assert.equal(r.scroll.size, 1);
	assert.deepEqual(r.scrollOptions.at(-1), { capture: true, passive: true });
	r.intersect(false);
	assert.equal(r.scroll.size, 0);
	r.intersect(true);
	assert.equal(r.scroll.size, 1);
});

test('destroying a panel removes its scroll listener and observer', () => {
	const r = render();
	r.intersect(true);
	r.destroy();
	assert.equal(r.scroll.size, 0);
	assert.equal(r.observers.filter((o) => o.live).length, 0);
});

test('overlay panels and stickyHandle={false} never observe or listen', () => {
	for (const props of [{ mode: 'overlay' }, { stickyHandle: false }]) {
		const r = render({ props });
		assert.equal(r.observers.length, 0);
		assert.equal(r.scroll.size, 0);
	}
});

test('without IntersectionObserver the panel keeps listening as before', () => {
	const r = render({ io: false });
	assert.equal(r.scroll.size, 1);
	r.destroy();
	assert.equal(r.scroll.size, 0);
});
