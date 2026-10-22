import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

/** @type {(() => void)[]} */
let observers = [];

function setup(hash = '#rich-select') {
	const dom = new JSDOM('<!doctype html><body><section id="rich-select"></section></body>', {
		url: `http://localhost/next${hash}`,
	});
	const w = dom.window;
	let aims = 0;
	w.HTMLElement.prototype.scrollIntoView = () => {
		aims++;
	};
	observers = [];
	const g = /** @type {any} */ (globalThis);
	Object.assign(g, {
		location: w.location,
		history: w.history,
		document: w.document,
		addEventListener: w.addEventListener.bind(w),
		removeEventListener: w.removeEventListener.bind(w),
		scrollY: 0,
		requestAnimationFrame: (/** @type {() => void} */ fn) => fn(),
		ResizeObserver: class {
			/** @param {() => void} cb */
			constructor(cb) {
				this.cb = cb;
				this.on = false;
				observers.push(() => this.on && cb());
			}
			observe() {
				this.on = true;
			}
			disconnect() {
				this.on = false;
			}
		},
	});
	return { w, aims: () => aims };
}

const { aimAtHash, resolveHash } = await import('../src/demo/framework/hash.ts');

test('aimAtHash re-aims at the target while the layout above it resizes', () => {
	const { aims } = setup();
	aimAtHash(10_000);
	assert.equal(aims(), 1);
	for (const fire of observers) fire();
	for (const fire of observers) fire();
	assert.equal(aims(), 3);
});

test('aimAtHash stops re-aiming once anything else scrolls the page', () => {
	const { aims } = setup();
	aimAtHash(10_000);
	/** @type {any} */ (globalThis).scrollY = 500;
	for (const fire of observers) fire();
	for (const fire of observers) fire();
	assert.equal(aims(), 1);
});

test('aimAtHash stops re-aiming on the first pointer input', () => {
	const { w, aims } = setup();
	aimAtHash(10_000);
	w.dispatchEvent(new w.Event('pointerdown'));
	for (const fire of observers) fire();
	assert.equal(aims(), 1);
});

test('aimAtHash rewrites a legacy anchor before aiming', () => {
	const { w } = setup('#toasts');
	aimAtHash(10);
	assert.equal(w.location.hash, '#toaster');
	assert.equal(resolveHash('#form-atoms'), 'input');
});
