import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { rule } from './helpers.mjs';

const seg = await readFile(
	new URL('../src/lib/components/molecules/SegmentedControl.svelte', import.meta.url),
	'utf8'
);
const css = seg.slice(seg.indexOf('<style>'));
const bundle = await buildFixture('mount-segmented-overflow.js');

test('the pill never grows past its container', () => {
	const r = rule(css, '.seg');
	assert.equal(r['max-width'], '100%');
	assert.equal(r['min-width'], '0');
});

test('an overflowing pill adopts the scroll layout without claiming a full flex line', () => {
	const scroll = rule(css, '.seg-scroll');
	const overflow = rule(css, '.seg-overflow');
	for (const prop of ['overflow-x', 'overflow-y', 'scrollbar-width', 'flex-wrap', '-webkit-overflow-scrolling']) {
		assert.equal(overflow[prop], scroll[prop], prop);
	}
	assert.equal(overflow.flex, undefined, 'a default pill keeps sitting beside its siblings');
	assert.equal(overflow['max-width'], undefined, 'the cap lives on .seg for every variant');
	assert.equal(rule(css, '.seg-overflow::-webkit-scrollbar').display, 'none');
	assert.equal(rule(css, '.seg-overflow .seg-item').flex, 'none');
	assert.match(seg, /class:seg-overflow=\{overflowing\}/);
	assert.match(seg, /\{@attach watchOverflow\}/);
});

test('block items shrink and truncate their label instead of pushing the pill wider', () => {
	const item = rule(css, '.seg-block .seg-item');
	assert.equal(item.flex, '1 1 0');
	assert.equal(item['min-width'], '0');
	const label = rule(css, '.seg-block .seg-label');
	assert.equal(label['min-width'], '0');
	assert.equal(label.overflow, 'hidden');
	assert.equal(label['text-overflow'], 'ellipsis');
	assert.equal(rule(css, '.seg-item')['white-space'], 'nowrap', 'ellipsis needs a single line');
});

test('the coarse-pointer slab and the keyboard contract are untouched', () => {
	assert.match(css, /\.seg-item::before\s*{[^}]*inset-block: var\(--touch-slab\)/);
	assert.equal(rule(css, '.seg').padding, '3px');
	assert.match(seg, /tabindex=\{stop\?\.value === o\.value \? 0 : -1\}/);
});

/** @param {{ wrap?: boolean, width: number, content: number }} opts */
function render({ wrap = false, width, content }) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const win = dom.window;
	/** @type {Array<() => void>} */
	const observers = [];
	let observed = 0;
	let disconnected = 0;
	win.ResizeObserver = class {
		/** @param {() => void} cb */
		constructor(cb) {
			observers.push(cb);
		}
		observe() {
			observed++;
		}
		disconnect() {
			disconnected++;
		}
	};
	const box = { width, content };
	Object.defineProperty(win.HTMLElement.prototype, 'clientWidth', { get: () => box.width, configurable: true });
	Object.defineProperty(win.HTMLElement.prototype, 'scrollWidth', { get: () => box.content, configurable: true });
	win.eval(bundle);
	const { mount, unmount, flushSync, Fixture } = win.__fixture;
	const app = mount(Fixture, { target: win.document.body, props: { wrap } });
	flushSync();
	const pill = /** @type {HTMLElement} */ (win.document.querySelector('[data-case="default"] [data-tsu="SegmentedControl"]'));
	return {
		pill,
		pills: () => [...win.document.querySelectorAll('[data-tsu="SegmentedControl"]')],
		resize: (/** @type {number} */ w, /** @type {number} */ c) => {
			box.width = w;
			box.content = c;
			for (const cb of observers) cb();
			flushSync();
		},
		counts: () => ({ observed, disconnected }),
		teardown: () => {
			unmount(app);
			flushSync();
		}
	};
}

test('a pill wider than its box switches to the scroll layout and back as the box resizes', () => {
	const ui = render({ width: 322, content: 474 });
	assert.ok(ui.pill.classList.contains('seg-overflow'));
	assert.ok(!ui.pill.classList.contains('seg-scroll'), 'the scroll prop itself stays off');
	ui.resize(474, 474);
	assert.ok(!ui.pill.classList.contains('seg-overflow'));
	ui.resize(473, 474);
	assert.ok(!ui.pill.classList.contains('seg-overflow'), 'a 1px rounding gap is not an overflow');
	ui.resize(400, 474);
	assert.ok(ui.pill.classList.contains('seg-overflow'));
	const before = ui.counts();
	ui.teardown();
	assert.equal(ui.counts().disconnected, before.observed, 'every observer is disconnected on unmount');
});

test('wrap opts out of the overflow fallback so rows keep wrapping', () => {
	const ui = render({ wrap: true, width: 322, content: 474 });
	assert.ok(ui.pill.classList.contains('seg-wrap'));
	assert.ok(!ui.pill.classList.contains('seg-overflow'));
	const wrapped = ui.pills().find((p) => p.getAttribute('aria-label') === 'Wrapped filter');
	assert.ok(wrapped && !wrapped.classList.contains('seg-overflow'));
});

test('a fitting pill keeps its plain layout', () => {
	const ui = render({ width: 474, content: 474 });
	for (const p of ui.pills()) assert.ok(!p.classList.contains('seg-overflow'), p.getAttribute('aria-label') ?? '');
});
