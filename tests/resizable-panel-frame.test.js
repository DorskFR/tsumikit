import assert from 'node:assert/strict';
import test from 'node:test';
import { createFrameBatcher } from '../src/lib/components/layouts/resizable-panel-frame.js';

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
