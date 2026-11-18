import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { mock } from 'node:test';
import { JSDOM } from 'jsdom';

const { visibleInterval } = await import('../src/demo/fixtures/visible.ts');

function setup() {
	const dom = new JSDOM('<!doctype html><body><div id="demo"></div></body>');
	const w = dom.window;
	let hidden = false;
	Object.defineProperty(w.document, 'hidden', { get: () => hidden });
	/** @type {((records: { isIntersecting: boolean }[]) => void)[]} */
	const observers = [];
	let disconnected = 0;
	class FakeObserver {
		/** @param {(records: { isIntersecting: boolean }[]) => void} cb */
		constructor(cb) {
			this.cb = cb;
			observers.push(cb);
		}
		observe() {}
		disconnect() {
			disconnected++;
			observers.splice(observers.indexOf(this.cb), 1);
		}
	}
	Object.assign(globalThis, { document: w.document, IntersectionObserver: FakeObserver });
	mock.timers.enable({ apis: ['setInterval'] });
	const node = /** @type {Element} */ (w.document.getElementById('demo'));
	return {
		node,
		/** @param {boolean} on */
		intersect: (on) => {
			for (const cb of observers) cb([{ isIntersecting: on }]);
		},
		/** @param {boolean} on */
		hide: (on) => {
			hidden = on;
			w.document.dispatchEvent(new w.Event('visibilitychange'));
		},
		disconnected: () => disconnected,
		done: () => mock.timers.reset(),
	};
}

test('visibleInterval ticks only while intersecting and resumes when back on screen', () => {
	const env = setup();
	let ticks = 0;
	const stop = visibleInterval(() => ticks++, 100)(env.node);
	mock.timers.tick(500);
	assert.equal(ticks, 0, 'no ticks before the first intersection');
	env.intersect(true);
	mock.timers.tick(300);
	assert.equal(ticks, 3);
	env.intersect(false);
	mock.timers.tick(1000);
	assert.equal(ticks, 3, 'paused off screen');
	env.intersect(true);
	mock.timers.tick(200);
	assert.equal(ticks, 5, 'resumed on screen');
	if (typeof stop === 'function') stop();
	env.done();
});

test('visibleInterval pauses while the document is hidden', () => {
	const env = setup();
	let ticks = 0;
	const stop = visibleInterval(() => ticks++, 100)(env.node);
	env.intersect(true);
	mock.timers.tick(100);
	env.hide(true);
	mock.timers.tick(1000);
	assert.equal(ticks, 1, 'paused while hidden');
	env.hide(false);
	mock.timers.tick(100);
	assert.equal(ticks, 2, 'resumed when visible');
	if (typeof stop === 'function') stop();
	env.done();
});

test('visibleInterval teardown stops the timer and disconnects; inactive never starts', () => {
	const env = setup();
	let ticks = 0;
	const stop = visibleInterval(() => ticks++, 100)(env.node);
	env.intersect(true);
	assert.equal(typeof stop, 'function');
	if (typeof stop === 'function') stop();
	mock.timers.tick(1000);
	assert.equal(ticks, 0);
	assert.equal(env.disconnected(), 1);
	env.hide(false);
	mock.timers.tick(1000);
	assert.equal(ticks, 0, 'visibilitychange listener removed');

	assert.equal(visibleInterval(() => ticks++, 100, () => false)(env.node), undefined);
	env.intersect(true);
	mock.timers.tick(1000);
	assert.equal(ticks, 0);
	env.done();
});

const DEMOS = [
	'atoms/Progress/01-Overview.svelte',
	'atoms/Progress/05-Motion.svelte',
	'atoms/Gauge/03-Thresholds.svelte',
	'atoms/TimeDisplay/01-Overview.svelte',
	'atoms/TimeDisplay/03-States.svelte',
	'atoms/Text/04-Numeric.svelte',
	'atoms/Button/07-Loading.svelte',
	'molecules/StatusBar/01-Overview.svelte',
	'organisms/ConversationFeed/01-Overview.svelte',
];

test('interval demos tick through visibleInterval, not a raw setInterval', async () => {
	for (const file of DEMOS) {
		const src = await readFile(new URL(`../src/demo/${file}`, import.meta.url), 'utf8');
		assert.doesNotMatch(src, /setInterval\(/, file);
		assert.match(src, /\{@attach visibleInterval\(/, file);
	}
});
