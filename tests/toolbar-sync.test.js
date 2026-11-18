import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-toolbar-sync.svelte.js');

function render() {
	const dom = new JSDOM('<!doctype html><html style="font-size:16px"><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const win = dom.window;
	/** @type {(() => void)[]} */
	const resizes = [];
	let width = 800;
	win.ResizeObserver = class {
		/** @param {ResizeObserverCallback} cb */
		constructor(cb) {
			this.cb = cb;
		}
		/** @param {Element} el */
		observe(el) {
			const fire = () =>
				this.cb([/** @type {ResizeObserverEntry} */ ({ target: el, contentRect: { width } })], /** @type {any} */ (this));
			resizes.push(fire);
			fire();
		}
		disconnect() {}
	};
	let rects = 0;
	win.HTMLElement.prototype.getClientRects = function () {
		rects++;
		const gone = this.closest('[hidden]') || (this.closest('[data-overflow]') && this.closest('.collapsed'));
		return /** @type {any} */ (gone ? [] : [{}]);
	};
	/** @type {FrameRequestCallback[]} */
	const frames = [];
	win.requestAnimationFrame = (cb) => frames.push(cb);
	win.cancelAnimationFrame = () => {};
	win.eval(bundle);
	const { mount, flushSync, Fixture, props } = win.__fixture;
	const state = props({});
	mount(Fixture, { target: win.document.body, props: state });
	flushSync();
	const settle = async () => {
		await new Promise((r) => setTimeout(r, 0));
		for (const f of frames.splice(0)) f(0);
		flushSync();
	};
	const resize = (/** @type {number} */ w) => {
		width = w;
		for (const fire of resizes) fire();
		flushSync();
	};
	const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (win.document.querySelector(s));
	const ring = () => ['#a', '#b', '#c'].map((s) => $(s).tabIndex);
	return { win, state, settle, resize, $, ring, frames, rects: () => rects };
}

test('the roving ring follows stops becoming disabled, hidden or collapsed', async () => {
	const ui = render();
	assert.deepEqual(ui.ring(), [0, -1, -1]);

	ui.state.disabled = true;
	await ui.settle();
	assert.deepEqual(ui.ring(), [-1, 0, -1], 'disabled first stop hands the tab stop on');

	ui.state.hidden = true;
	await ui.settle();
	assert.equal(ui.$('#c').tabIndex, 0, 'hidden stop leaves the ring');

	ui.resize(200);
	await ui.settle();
	assert.equal(ui.$('#c').tabIndex, -1, 'collapsed overflow child leaves the ring');
	const more = /** @type {HTMLElement} */ (ui.win.document.querySelector('[data-tsu="Toolbar"] .pop-trigger, [data-tsu="Toolbar"] [aria-haspopup]'));
	assert.ok(more, 'overflow trigger rendered');
	assert.equal(more.tabIndex, 0, 'the overflow trigger takes the tab stop');

	ui.resize(800);
	await ui.settle();
	assert.equal(ui.$('#c').tabIndex, 0, 'expanded child rejoins the ring');
});

test('style and class writes inside the bar do not re-read the ring', async () => {
	const ui = render();
	await ui.settle();
	const before = ui.rects();
	ui.$('#a').style.setProperty('--pointer-x', '12px');
	ui.$('#b').classList.add('hot');
	await ui.settle();
	assert.equal(ui.rects(), before);
});

test('mutations in one frame coalesce into one ring read', async () => {
	const ui = render();
	await ui.settle();
	ui.$('#a').setAttribute('aria-hidden', 'true');
	ui.$('#b').setAttribute('aria-hidden', 'true');
	ui.$('#a').removeAttribute('aria-hidden');
	await new Promise((r) => setTimeout(r, 0));
	assert.equal(ui.frames.length, 1);
});
