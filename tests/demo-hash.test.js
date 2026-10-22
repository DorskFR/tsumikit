import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

function setup(hash = '#rich-select') {
	const dom = new JSDOM(
		'<!doctype html><body><a id="old" href="#toasts">old</a><a id="cur" href="#rich-select">cur</a><a id="out" href="#nowhere">out</a><section id="rich-select"></section><section id="toaster"></section></body>',
		{ url: `http://localhost/${hash}` },
	);
	const w = dom.window;
	let aims = 0;
	/** @type {Record<string, number>} */
	const tops = {};
	w.HTMLElement.prototype.scrollIntoView = function () {
		aims++;
		tops[this.id] = 68;
	};
	w.HTMLElement.prototype.getBoundingClientRect = function () {
		const top = tops[this.id] ?? 0;
		return /** @type {DOMRect} */ ({ top, bottom: top + 100 });
	};
	/** @type {((t: number) => void)[]} */
	let queued = [];
	const g = /** @type {any} */ (globalThis);
	Object.assign(g, {
		location: w.location,
		history: w.history,
		document: w.document,
		Element: w.Element,
		addEventListener: w.addEventListener.bind(w),
		removeEventListener: w.removeEventListener.bind(w),
		requestAnimationFrame: (/** @type {(t: number) => void} */ fn) => queued.push(fn),
		cancelAnimationFrame: (/** @type {number} */ handle) => {
			if (handle) queued[handle - 1] = () => {};
		},
	});
	const frame = (/** @type {number} */ t) => {
		const run = queued;
		queued = [];
		for (const fn of run) fn(t);
	};
	const drift = (/** @type {string} */ id, /** @type {number} */ top) => {
		tops[id] = top;
	};
	const click = (/** @type {string} */ id, init = {}) => {
		const e = new w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
		w.document.getElementById(id)?.dispatchEvent(e);
		return e.defaultPrevented;
	};
	return { w, aims: () => aims, frame, drift, click };
}

const { aim, aiming, aimAtHash, followHashes, resolveHash } = await import('../src/demo/framework/hash.ts');
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

test('aim re-aims every frame the target drifts, whatever moved it', () => {
	const { aims, frame, drift } = setup();
	aim('rich-select', 10_000);
	frame(16);
	assert.equal(aims(), 1);
	frame(32);
	assert.equal(aims(), 1, 'holding still needs no correction');
	drift('rich-select', 900);
	frame(48);
	assert.equal(aims(), 2);
	drift('rich-select', -1032);
	frame(64);
	assert.equal(aims(), 3);
});

test('aim stops on the first user input', () => {
	const { w, aims, frame, drift } = setup();
	aim('rich-select', 10_000);
	frame(16);
	w.dispatchEvent(new w.Event('pointerdown'));
	drift('rich-select', 900);
	frame(32);
	assert.equal(aims(), 1);
	assert.equal(aiming(), false);
});

test('aim settles in frame time: a busy main thread still lands, then it lets go', () => {
	const { aims, frame, drift } = setup();
	aim('rich-select', 100);
	frame(10_000);
	assert.equal(aims(), 1, 'the first frame aims however late it comes');
	drift('rich-select', 500);
	frame(10_050);
	assert.equal(aims(), 2);
	frame(10_140);
	assert.equal(aiming(), true, 'a correction restarts the window');
	frame(10_150);
	assert.equal(aiming(), false);
	drift('rich-select', 500);
	frame(10_200);
	assert.equal(aims(), 2);
});

test('aim gives up after maxMs on a target that never holds still', () => {
	const { aims, frame, drift } = setup();
	aim('rich-select', 100, 300);
	for (let t = 0; t <= 400; t += 50) {
		drift('rich-select', 900);
		frame(t + 1);
	}
	assert.equal(aiming(), false);
	assert.equal(aims(), 7);
});

test('aimAtHash rewrites a former anchor, mounts and aims at its section', () => {
	const { w, aims, frame } = setup('#toasts');
	/** @type {string[]} */
	const reached = [];
	aimAtHash((id) => reached.push(id));
	assert.equal(w.location.hash, '#toaster');
	assert.deepEqual(reached, ['toaster']);
	frame(16);
	assert.equal(aims(), 1);
	assert.equal(resolveHash('#form-atoms'), 'input');
});

test('link clicks land through aim: former anchors, the current hash and hash changes', async () => {
	const { w, aims, frame, click } = setup('#rich-select');
	/** @type {string[]} */
	const reached = [];
	const off = followHashes((id) => reached.push(id));

	assert.equal(click('old'), true);
	assert.equal(w.location.hash, '#toaster');
	frame(16);
	assert.equal(aims(), 1);

	w.history.replaceState(null, '', '#rich-select');
	assert.equal(click('cur'), true, 'a click on the current hash still aims');
	frame(32);
	assert.equal(aims(), 2);

	assert.equal(aims(), 2);

	w.location.hash = '#toaster';
	await tick(10);
	frame(48);
	assert.ok(aims() >= 3);
	assert.deepEqual(reached, ['toaster', 'rich-select', 'toaster']);
	off();
});

test('modified clicks and unknown targets keep the native behaviour', () => {
	const { aims, frame, click } = setup('#rich-select');
	const off = followHashes();
	assert.equal(click('cur', { ctrlKey: true }), false);
	assert.equal(click('out'), false);
	frame(16);
	assert.equal(aims(), 0);
	off();
});
