import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-scrollspy.svelte.js');
const PAGE = 5000;

/** @param {Record<string, number>} initial Document-space top of each section. */
function render(initial) {
	const tops = { ...initial };
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const w = /** @type {any} */ (dom.window);
	let y = 0;
	Object.defineProperty(w, 'scrollY', { get: () => y, configurable: true });
	Object.defineProperty(w, 'innerHeight', { value: 800, configurable: true });
	Object.defineProperty(w.document.documentElement, 'scrollHeight', { get: () => PAGE, configurable: true });
	/** @type {FrameRequestCallback[]} */
	const frames = [];
	w.requestAnimationFrame = (/** @type {FrameRequestCallback} */ fn) => frames.push(fn);
	const ro = { cb: /** @type {(() => void) | null} */ (null), observe: 0, live: false, els: new Set() };
	w.ResizeObserver = class {
		/** @param {() => void} cb */
		constructor(cb) {
			ro.cb = cb;
			ro.live = true;
		}
		/** @param {Element} el */
		observe(el) {
			ro.observe++;
			ro.els.add(el);
		}
		/** @param {Element} el */
		unobserve(el) {
			ro.els.delete(el);
		}
		disconnect() {
			ro.live = false;
			ro.els.clear();
		}
	};
	let reads = 0;
	w.HTMLElement.prototype.getBoundingClientRect = function () {
		reads++;
		const top = (tops[this.id] ?? 0) - y;
		return { top, bottom: top + 100, left: 0, right: 0, width: 0, height: 100, x: 0, y: top };
	};
	/** @type {Set<unknown>} */
	const scroll = new Set();
	const add = w.addEventListener.bind(w);
	const remove = w.removeEventListener.bind(w);
	w.addEventListener = (/** @type {string} */ type, /** @type {any} */ fn, /** @type {any} */ o) => {
		if (type === 'scroll') scroll.add(fn);
		add(type, fn, o);
	};
	w.removeEventListener = (/** @type {string} */ type, /** @type {any} */ fn, /** @type {any} */ o) => {
		if (type === 'scroll') scroll.delete(fn);
		remove(type, fn, o);
	};
	w.eval(bundle);
	const { mount, unmount, flushSync, Fixture, props } = w.__fixture;
	const live = props({ ids: Object.keys(tops), hidden: [], query: '' });
	const app = mount(Fixture, { target: w.document.body, props: live });
	flushSync();
	const frame = () => {
		frames.splice(0).forEach((fn) => fn(0));
		flushSync();
	};
	return {
		tops,
		root: w.document.documentElement,
		props: live,
		ro,
		scroll,
		flushSync,
		reads: () => reads,
		active: () => w.document.querySelector('output').dataset.active,
		/** @param {number} to */
		scrollTo(to) {
			y = to;
			w.dispatchEvent(new w.Event('scroll'));
			frame();
		},
		frame,
		destroy() {
			unmount(app);
			flushSync();
		}
	};
}

const TOPS = { a: 0, b: 1000, c: 2000, d: 3000 };

test('the active section is the last one past the line as the page scrolls', () => {
	const r = render(TOPS);
	assert.equal(r.active(), 'a');
	r.scrollTo(949);
	assert.equal(r.active(), 'a');
	r.scrollTo(950);
	assert.equal(r.active(), 'b');
	r.scrollTo(2500);
	assert.equal(r.active(), 'c');
	r.scrollTo(PAGE - 800);
	assert.equal(r.active(), 'd');
	r.scrollTo(0);
	assert.equal(r.active(), 'a');
});

test('scroll frames reuse the measured tops instead of reading layout', () => {
	const r = render(TOPS);
	const measured = r.reads();
	assert.equal(measured, 4);
	for (const to of [100, 1200, 2100, 3100]) r.scrollTo(to);
	assert.equal(r.reads(), measured);
	assert.equal(r.active(), 'd');
});

test('a keystroke that keeps the section list does not measure', () => {
	const r = render(TOPS);
	const measured = r.reads();
	const observed = r.ro.observe;
	r.props.query = 'b';
	r.flushSync();
	r.frame();
	assert.equal(r.reads(), measured);
	assert.equal(r.ro.observe, observed);
});

test('a keystroke that changes the section list re-measures and re-picks', () => {
	const r = render(TOPS);
	r.scrollTo(1500);
	assert.equal(r.active(), 'b');
	const measured = r.reads();
	r.props.hidden = ['b'];
	r.flushSync();
	assert.equal(r.reads(), measured + 3);
	assert.equal(r.active(), 'a');
});

test('a resize of a section or the page reads no layout until the next scroll, which re-measures', () => {
	const r = render(TOPS);
	assert.ok(r.ro.els.has(r.root));
	assert.equal(r.ro.els.size, 5);
	r.tops.b = 400;
	const measured = r.reads();
	r.ro.cb?.();
	r.frame();
	assert.equal(r.reads(), measured, 'a layout change alone must not measure');
	r.scrollTo(360);
	assert.equal(r.reads(), measured + 4);
	assert.equal(r.active(), 'b');
});

test('destroy drops the scroll listener and the resize observer', () => {
	const r = render(TOPS);
	assert.equal(r.scroll.size, 1);
	r.destroy();
	assert.equal(r.scroll.size, 0);
	assert.equal(r.ro.live, false);
});
