import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(p, import.meta.url), 'utf8');
const [swatch, slider, bundle] = await Promise.all([
	read('../src/lib/components/atoms/Swatch.svelte'),
	read('../src/lib/components/atoms/Slider.svelte'),
	buildFixture('mount-atoms-a11y.js')
]);

function env() {
	const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', pretendToBeVisual: true });
	dom.window.eval(bundle);
	return { dom, win: dom.window, doc: dom.window.document, fx: dom.window.__fixture };
}

/** @param {string} name @param {Record<string, unknown>} props */
function render(name, props) {
	const { doc, fx } = env();
	fx.mount(fx[name], { target: doc.body, props });
	fx.flushSync();
	return /** @type {HTMLElement} */ (doc.body.querySelector(`[data-tsu="${name}"]`));
}

test('Avatar without a name is decorative, not an unnamed image', () => {
	for (const name of ['', '  ']) {
		const el = render('Avatar', { name, glyph: '🤖' });
		assert.equal(el.getAttribute('role'), null);
		assert.equal(el.getAttribute('aria-hidden'), 'true');
		assert.equal(el.getAttribute('aria-label'), null);
	}
	const named = render('Avatar', { name: 'nanachi' });
	assert.equal(named.getAttribute('role'), 'img');
	assert.equal(named.getAttribute('aria-label'), 'nanachi');
});

test('Artwork fallback tile with empty alt is decorative', () => {
	const bare = render('Artwork', { alt: '' });
	assert.equal(bare.getAttribute('role'), null);
	assert.equal(bare.getAttribute('aria-hidden'), 'true');
	const named = render('Artwork', { alt: 'Cover' });
	assert.equal(named.getAttribute('role'), 'img');
	assert.equal(named.getAttribute('aria-label'), 'Cover');
	assert.equal(named.getAttribute('aria-hidden'), null);
});

test('interactive bare Dot is named by its status; explicit aria-label wins', () => {
	assert.equal(render('Dot', { interactive: true, status: 'stale' }).getAttribute('aria-label'), 'stale');
	assert.equal(render('Dot', { interactive: true, 'aria-label': 'Online' }).getAttribute('aria-label'), 'Online');
	assert.equal(render('Dot', { status: 'stale' }).getAttribute('aria-label'), null);
	assert.equal(render('Dot', { interactive: true, label: 'Live' }).getAttribute('aria-label'), 'Live');
});

test('Slider aria-valuetext comes from the mark label, else a passed format', () => {
	const input = (/** @type {Record<string, unknown>} */ p) =>
		/** @type {HTMLInputElement} */ (render('Slider', { label: 'x', ...p }).querySelector('input'));
	const marks = [{ value: 0, label: 'XS' }, { value: 3, label: 'Large' }];
	assert.equal(input({ min: 0, max: 4, value: 3, marks }).getAttribute('aria-valuetext'), 'Large');
	assert.equal(input({ value: 40, format: (/** @type {number} */ v) => `${v}%` }).getAttribute('aria-valuetext'), '40%');
	assert.equal(input({ value: 40 }).getAttribute('aria-valuetext'), null);
	assert.equal(input({ value: 40, 'aria-valuetext': 'forty' }).getAttribute('aria-valuetext'), 'forty');
});

test('autoresize re-measures when the inline size changes, not on height-only changes', () => {
	const { win, doc, fx } = env();
	/** @type {ResizeObserverCallback | undefined} */
	let cb;
	let disconnected = false;
	win.ResizeObserver = class {
		/** @param {ResizeObserverCallback} c */
		constructor(c) {
			cb = c;
		}
		observe() {}
		disconnect() {
			disconnected = true;
		}
	};
	const ta = doc.createElement('textarea');
	ta.rows = 1;
	doc.body.append(ta);
	let scroll = 0;
	Object.defineProperty(ta, 'scrollHeight', { get: () => scroll });
	const action = fx.autoresize(ta, '');
	assert.equal(ta.style.height, '0px');
	const fire = (/** @type {number} */ width) =>
		cb?.([/** @type {ResizeObserverEntry} */ ({ contentRect: { width } })], /** @type {any} */ ({}));
	scroll = 120;
	fire(0);
	assert.equal(ta.style.height, '0px');
	fire(300);
	assert.equal(ta.style.height, '120px');
	scroll = 160;
	fire(300);
	assert.equal(ta.style.height, '120px');
	fire(200);
	assert.equal(ta.style.height, '160px');
	action.destroy();
	assert.ok(disconnected);
});

test('copyToClipboard fallback restores focus and selection', async () => {
	const { win, doc, fx } = env();
	Object.defineProperty(win.navigator, 'clipboard', { value: undefined, configurable: true });
	doc.body.innerHTML = '<p id="p">hello world</p><button id="b">copy</button>';
	/** @type {HTMLTextAreaElement | null} */
	let used = null;
	doc.execCommand = () => {
		used = doc.querySelector('textarea');
		return true;
	};
	const btn = /** @type {HTMLButtonElement} */ (doc.getElementById('b'));
	btn.focus();
	const range = doc.createRange();
	range.selectNodeContents(/** @type {Node} */ (doc.getElementById('p')));
	doc.getSelection()?.removeAllRanges();
	doc.getSelection()?.addRange(range);
	assert.equal(await fx.copyToClipboard('secret'), true);
	assert.equal(/** @type {any} */ (used)?.tagName, 'TEXTAREA');
	assert.ok(/** @type {any} */ (used)?.hasAttribute('readonly'));
	assert.equal(doc.activeElement, btn);
	assert.equal(doc.getSelection()?.rangeCount, 1);
	assert.equal(doc.getSelection()?.getRangeAt(0).toString(), 'hello world');
	assert.equal(doc.querySelector('textarea'), null);
});

test('interactive Swatch and Slider range get coarse-pointer hit areas', () => {
	const flat = (/** @type {string} */ s) => s.replace(/\s+/g, ' ');
	assert.match(
		flat(swatch),
		/@media \(pointer: coarse\) \{ \.interactive \{ position: relative; \} \.interactive::before \{ content: ''; position: absolute; inset-block: var\(--touch-slab\); inset-inline-start: var\(--touch-slab\); inset-inline-end: 0; \} \}/
	);
	assert.match(flat(slider), /@media \(pointer: coarse\) \{ input\[type='range'\] \{ min-height: var\(--touch-target-compact\); \} \}/);
});
