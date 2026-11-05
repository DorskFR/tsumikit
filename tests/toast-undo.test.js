import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { installFakeClock } from './fixtures/fake-clock.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(p, import.meta.url), 'utf8');
const [store, index, bundle] = await Promise.all([
	read('../src/lib/stores/toast.svelte.ts'),
	read('../src/lib/index.ts'),
	buildFixture('mount-toast-undo.svelte.js')
]);

const settle = () => new Promise((r) => setImmediate(r));

function env() {
	const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const w = dom.window;
	const clock = installFakeClock(w);
	w.eval(bundle);
	/** @type {{ toasts: any, flushSync: () => void }} */
	const { toasts, flushSync } = w.__fixture;
	/** @type {string[]} */
	const log = [];
	/** @param {Partial<Record<'commit' | 'revert', () => void | Promise<void>>>} [over] */
	const undo = (over = {}) =>
		toasts.undo({
			message: 'Message deleted',
			apply: () => log.push('apply'),
			commit: over.commit ?? (() => void log.push('commit')),
			revert: over.revert ?? (() => void log.push('revert'))
		});
	return { w, clock, toasts, flushSync, log, undo };
}

test('undo: apply runs at once and the toast carries an Undo action with the action duration', () => {
	const { toasts, log, undo } = env();
	const id = undo();
	assert.deepEqual(log, ['apply']);
	const t = toasts.items.find((/** @type {any} */ x) => x.id === id);
	assert.equal(t.action.label, 'Undo');
	assert.equal(t.duration, 7000);
	assert.equal(t.tone, 'neutral');
});

test('undo: timeout commits once', async () => {
	const { clock, log, undo, toasts } = env();
	undo();
	clock.advance(6999);
	assert.deepEqual(log, ['apply']);
	clock.advance(1);
	await settle();
	assert.deepEqual(log, ['apply', 'commit']);
	clock.advance(1000);
	toasts.flush();
	await settle();
	assert.deepEqual(log, ['apply', 'commit']);
	assert.equal(toasts.items.length, 0);
});

test('undo: dismissing the toast commits', async () => {
	const { log, undo, toasts } = env();
	const id = undo();
	toasts.dismiss(id);
	await settle();
	assert.deepEqual(log, ['apply', 'commit']);
});

test('undo: the Undo action reverts and never commits', async () => {
	const { clock, log, undo, toasts } = env();
	const id = undo();
	await toasts.act(id);
	assert.deepEqual(log, ['apply', 'revert']);
	clock.advance(10000);
	toasts.flush();
	await settle();
	assert.deepEqual(log, ['apply', 'revert']);
	assert.equal(toasts.items.length, 0);
});

test('undo: a rejected commit reverts and shows a plain-words error toast', async () => {
	const { clock, log, undo, toasts } = env();
	undo({ commit: () => Promise.reject(new Error('500')) });
	clock.advance(7000);
	await settle();
	assert.deepEqual(log, ['apply', 'revert']);
	const err = toasts.items.find((/** @type {any} */ t) => t.tone === 'error');
	assert.ok(err);
	assert.equal(err.message, 'The change could not be saved, so it was undone.');
	assert.doesNotMatch(err.message, /500/);
});

test('undo: a commit that throws synchronously is handled the same way', async () => {
	const { log, undo, toasts } = env();
	const id = undo({
		commit: () => {
			throw new Error('boom');
		}
	});
	toasts.dismiss(id);
	await settle();
	assert.deepEqual(log, ['apply', 'revert']);
	assert.ok(toasts.items.some((/** @type {any} */ t) => t.tone === 'error'));
});

test('undo: pagehide flushes every pending commit, undone toasts excluded', async () => {
	const { w, log, undo, toasts } = env();
	undo();
	const second = undo();
	await toasts.act(second);
	w.dispatchEvent(new w.Event('pagehide'));
	await settle();
	assert.deepEqual(log, ['apply', 'apply', 'revert', 'commit']);
	w.dispatchEvent(new w.Event('pagehide'));
	await settle();
	assert.deepEqual(log, ['apply', 'apply', 'revert', 'commit']);
});

test('undo: options and constants are exported', () => {
	assert.match(store, /undo\(opts: UndoOptions\): number/);
	assert.match(store, /export const UNDO_FAIL_MESSAGE = /);
	assert.match(store, /window\.addEventListener\('pagehide', \(\) => this\.flush\(\)\)/);
	assert.match(index, /type UndoOptions,\s*} from '\.\/stores\/toast\.svelte';/);
	assert.match(index, /UNDO_FAIL_MESSAGE,/);
});
