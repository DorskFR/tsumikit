import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { installFakeClock } from './fixtures/fake-clock.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(p, import.meta.url), 'utf8');
const [helper, button, empty, index, bundle] = await Promise.all([
	read('../src/lib/pending.svelte.ts'),
	read('../src/lib/components/atoms/Button.svelte'),
	read('../src/lib/components/molecules/EmptyState.svelte'),
	read('../src/lib/index.ts'),
	buildFixture('mount-pending.svelte.js')
]);

/** @param {Record<string, unknown>} init */
function render(init = {}) {
	const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const w = dom.window;
	const clock = installFakeClock(w);
	w.eval(bundle);
	const { mount, unmount, flushSync, Fixture, props } = w.__fixture;
	const p = props(init);
	const app = mount(Fixture, { target: w.document.body, props: p });
	flushSync();
	const doc = w.document;
	const r = {
		clock,
		props: p,
		/** @param {Partial<typeof init>} patch */
		set(patch) {
			Object.assign(p, patch);
			flushSync();
		},
		/** @param {number} ms */
		tick(ms) {
			clock.advance(ms);
			flushSync();
		},
		get raw() {
			return doc.querySelector('[data-part="raw"]')?.getAttribute('data-visible');
		},
		get buttons() {
			return /** @type {HTMLButtonElement[]} */ ([...doc.querySelectorAll('button.btn')]);
		},
		get spinner() {
			return doc.querySelector('.btn-spinner') !== null;
		},
		get empty() {
			return /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="EmptyState"]'));
		},
		get emptySpinner() {
			return doc.querySelector('[data-tsu="EmptyState"] .empty-chip') !== null;
		},
		unmount: () => unmount(app)
	};
	return r;
}

test('pending: a 100ms busy shows nothing, aria-busy still covers the whole window', () => {
	const r = render({ busy: true });
	assert.equal(r.raw, 'false');
	assert.equal(r.spinner, false);
	for (const b of r.buttons) {
		assert.equal(b.getAttribute('aria-busy'), 'true');
		assert.equal(b.disabled, true);
		assert.equal(b.classList.contains('loading'), false);
		assert.equal(b.classList.contains('btn-busy'), true);
	}
	assert.equal(r.empty.getAttribute('aria-busy'), 'true');
	assert.equal(r.emptySpinner, false);
	r.tick(100);
	r.set({ busy: false });
	assert.equal(r.raw, 'false');
	assert.equal(r.spinner, false);
	r.tick(1000);
	assert.equal(r.raw, 'false');
	assert.equal(r.spinner, false);
	assert.equal(r.clock.pending(), 0);
	r.unmount();
});

test('pending: a 300ms busy is visible from 200ms to 700ms', () => {
	const r = render({ busy: true });
	r.tick(199);
	assert.equal(r.raw, 'false');
	r.tick(1);
	assert.equal(r.raw, 'true');
	assert.equal(r.spinner, true);
	assert.equal(r.emptySpinner, true);
	assert.ok(r.buttons.every((b) => b.classList.contains('loading')));
	r.tick(100);
	r.set({ busy: false });
	assert.equal(r.raw, 'true', 'still held at 300ms');
	assert.ok(r.buttons.every((b) => b.getAttribute('aria-busy') === null && !b.disabled), 'aria-busy follows the real state');
	assert.equal(r.empty.getAttribute('aria-busy'), null);
	r.tick(399);
	assert.equal(r.raw, 'true', 'still held at 699ms');
	r.tick(1);
	assert.equal(r.raw, 'false', 'hidden at 700ms');
	assert.equal(r.spinner, false);
	assert.equal(r.emptySpinner, false);
	r.unmount();
});

test('pending: flipping busy back on inside the min window keeps the indicator without restarting', () => {
	const r = render({ busy: true });
	r.tick(200);
	assert.equal(r.raw, 'true');
	r.tick(100);
	r.set({ busy: false });
	r.tick(100);
	r.set({ busy: true });
	assert.equal(r.raw, 'true', 'no gap, no new delay');
	r.tick(300);
	assert.equal(r.raw, 'true', 'min window elapsed but still busy');
	r.set({ busy: false });
	assert.equal(r.raw, 'false', 'hides at once after the min window');
	r.unmount();
});

test('pending: delay 0 and min 0 follow the flag synchronously', () => {
	const r = render({ busy: false, delay: 0, min: 0 });
	r.set({ busy: true });
	assert.equal(r.raw, 'true');
	assert.equal(r.spinner, true);
	r.set({ busy: false });
	assert.equal(r.raw, 'false');
	assert.equal(r.spinner, false);
	assert.equal(r.clock.pending(), 0);
	r.unmount();
});

test('pending: unmounting cancels timers', () => {
	const r = render({ busy: true });
	r.unmount();
	assert.equal(r.clock.pending(), 0);
});

test('pending: exported with 200/500 defaults; Button and EmptyState take loadingDelay/loadingMin', () => {
	assert.match(helper, /export const PENDING_DELAY_MS = 200;/);
	assert.match(helper, /export const PENDING_MIN_MS = 500;/);
	assert.match(index, /pending,?\s*} from '\.\/pending\.svelte';/);
	assert.match(button, /loadingDelay\?: number;\s*loadingMin\?: number;/);
	assert.match(button, /pending\(\(\) => busy, \(\) => \({ delay: loadingDelay, min: loadingMin }\)\)/);
	assert.match(button, /aria-busy=\{busy \|\| undefined\}/);
	assert.match(empty, /loadingDelay\?: number;\s*loadingMin\?: number;/);
	assert.match(empty, /pending\(\(\) => loading, \(\) => \({ delay: loadingDelay, min: loadingMin }\)\)/);
	assert.match(empty, /aria-busy=\{loading \? 'true' : undefined\}/);
	assert.match(empty, /max-inline-size: var\(--measure, 68ch\);/);
});
