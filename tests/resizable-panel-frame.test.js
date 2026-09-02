import assert from 'node:assert/strict';
import test from 'node:test';
import {
	createFrameBatcher,
	resizeHandle,
	resolveLength
} from '../src/lib/components/layouts/resizable-panel-frame.js';

function harness() {
	/** @type {Map<number, FrameRequestCallback>} */
	const callbacks = new Map();
	/** @type {number[]} */
	const cancelled = [];
	/** @type {number[]} */
	const applied = [];
	let nextHandle = 1;
	const batcher = createFrameBatcher(
		(callback) => {
			const handle = nextHandle++;
			callbacks.set(handle, callback);
			return handle;
		},
		(handle) => cancelled.push(handle),
		(value) => applied.push(value)
	);

	return { applied, batcher, callbacks, cancelled };
}

/**
 * @param {Map<number, FrameRequestCallback>} callbacks
 * @param {number} handle
 */
function runFrame(callbacks, handle) {
	const callback = callbacks.get(handle);
	assert.ok(callback);
	callback(0);
}

test('pointer updates are coalesced into at most one pending animation frame', () => {
	const { applied, batcher, callbacks } = harness();
	batcher.schedule(240);
	batcher.schedule(260);
	batcher.schedule(280);

	assert.equal(callbacks.size, 1);
	assert.deepEqual(applied, []);
	runFrame(callbacks, 1);
	assert.deepEqual(applied, [280]);

	batcher.schedule(300);
	assert.equal(callbacks.size, 2);
});

test('release flushes and persists the final pointer value before the queued frame', () => {
	const { applied, batcher, callbacks, cancelled } = harness();
	batcher.schedule(240);
	batcher.schedule(260);
	batcher.flush(275);

	assert.deepEqual(cancelled, [1]);
	assert.deepEqual(applied, [275]);

	// A callback already queued by a test double or browser race is harmless.
	runFrame(callbacks, 1);
	assert.deepEqual(applied, [275]);
});

test('discard cancels pending work without applying it', () => {
	const { applied, batcher, callbacks, cancelled } = harness();
	batcher.schedule(240);
	batcher.discard();

	assert.deepEqual(cancelled, [1]);
	runFrame(callbacks, 1);
	assert.deepEqual(applied, []);
});

/**
 * @param {Partial<import('../src/lib/components/layouts/resizable-panel-frame.js').ResizeHandleParams>} [params]
 */
function actionHarness(params = {}) {
	/** @type {Map<number, FrameRequestCallback>} */
	const frames = new Map();
	let nextHandle = 1;
	globalThis.requestAnimationFrame = (callback) => {
		const handle = nextHandle++;
		frames.set(handle, callback);
		return handle;
	};
	globalThis.cancelAnimationFrame = (handle) => {
		frames.delete(handle);
	};

	/** @type {Map<string, (event: any) => void>} */
	const listeners = new Map();
	/** @type {number[]} */
	const captured = [];
	/** @type {number[]} */
	const released = [];
	let parentWidth = 300;
	/** @type {any} */
	const node = {
		parentElement: { getBoundingClientRect: () => ({ width: parentWidth }) },
		/** @param {string} type @param {(event: any) => void} fn */
		addEventListener: (type, fn) => listeners.set(type, fn),
		/** @param {string} type */
		removeEventListener: (type) => listeners.delete(type),
		/** @param {number} id */
		setPointerCapture: (id) => captured.push(id),
		/** @param {number} id */
		releasePointerCapture: (id) => released.push(id)
	};
	/** @type {number[]} */
	const widths = [];
	/** @type {number[]} */
	const commits = [];
	/** @type {boolean[]} */
	const activity = [];
	const action = resizeHandle(node, {
		side: 'left',
		min: 100,
		max: 500,
		onwidth: (w) => widths.push(w),
		oncommit: (w) => commits.push(w),
		onactive: (a) => activity.push(a),
		...params
	});
	/** @param {string} type @param {Record<string, unknown>} event */
	const fire = (type, event) => {
		const listener = listeners.get(type);
		assert.ok(listener);
		listener({ preventDefault() {}, button: 0, ...event });
	};
	const runFrames = () => {
		for (const [handle, callback] of [...frames]) {
			frames.delete(handle);
			callback(0);
		}
	};
	return {
		action,
		activity,
		captured,
		commits,
		fire,
		frames,
		listeners,
		released,
		runFrames,
		/** @param {number} w */
		setParentWidth: (w) => {
			parentWidth = w;
		},
		widths
	};
}

test('resizeHandle drags the parent width with one rAF-coalesced update and commits on release', () => {
	const h = actionHarness();
	h.fire('pointerdown', { clientX: 300, pointerId: 7 });
	assert.deepEqual(h.captured, [7]);
	assert.deepEqual(h.activity, [true]);

	h.fire('pointermove', { clientX: 320 });
	h.fire('pointermove', { clientX: 350 });
	assert.deepEqual(h.widths, []);
	assert.equal(h.frames.size, 1);
	h.runFrames();
	assert.deepEqual(h.widths, [350]);

	h.fire('pointerup', { clientX: 900, pointerId: 7 });
	assert.deepEqual(h.widths, [350, 500]);
	assert.deepEqual(h.commits, [500]);
	assert.deepEqual(h.released, [7]);
	assert.deepEqual(h.activity, [true, false]);
});

test('resizeHandle on the right edge grows when dragging left and ignores secondary buttons', () => {
	const h = actionHarness({ side: 'right' });
	h.fire('pointerdown', { clientX: 400, pointerId: 1, button: 2 });
	assert.deepEqual(h.captured, []);

	h.fire('pointerdown', { clientX: 400, pointerId: 1 });
	h.fire('pointerup', { clientX: 340, pointerId: 1 });
	assert.deepEqual(h.widths, [360]);
});

test('resizeHandle keyboard steps follow the side and Home/End jump to the bounds', () => {
	const h = actionHarness({ step: 20, measure: () => 240 });
	h.fire('keydown', { key: 'ArrowRight' });
	h.fire('keydown', { key: 'ArrowLeft' });
	h.fire('keydown', { key: 'Home' });
	h.fire('keydown', { key: 'End' });
	h.fire('keydown', { key: 'Tab' });
	assert.deepEqual(h.widths, [260, 220, 100, 500]);
	assert.deepEqual(h.commits, [260, 220, 100, 500]);

	h.action.update({ side: 'right', step: 20, measure: () => 240, onwidth: (w) => h.widths.push(w) });
	h.fire('keydown', { key: 'ArrowRight' });
	assert.equal(h.widths.at(-1), 220);
});

test('resizeHandle double-click resets and destroy detaches every listener', () => {
	let resets = 0;
	const h = actionHarness({ onreset: () => resets++ });
	h.fire('dblclick', {});
	assert.equal(resets, 1);
	h.fire('pointerdown', { clientX: 0, pointerId: 1 });
	h.fire('pointermove', { clientX: 10 });
	h.action.destroy();
	assert.equal(h.listeners.size, 0);
	assert.equal(h.frames.size, 0);
});

test('resolveLength passes numbers and px strings through and measures other lengths', () => {
	assert.equal(resolveLength(240, () => 1), 240);
	assert.equal(resolveLength('12.5px', () => 1), 12.5);
	assert.equal(resolveLength('20rem', (css) => (css === '20rem' ? 320 : 0)), 320);
	assert.equal(resolveLength('20rem', () => undefined), undefined);
	assert.equal(resolveLength(Number.NaN, () => 1), undefined);
});
