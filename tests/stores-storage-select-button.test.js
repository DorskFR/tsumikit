import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(p, import.meta.url), 'utf8');
const [fontscale, themeSrc, storage, selectButton, bundle] = await Promise.all([
	read('../src/lib/stores/fontscale.svelte.ts'),
	read('../src/lib/stores/theme.svelte.ts'),
	read('../src/lib/stores/storage.ts'),
	read('../src/lib/components/molecules/SelectButton.svelte'),
	buildFixture('mount-stores-select-button.js')
]);

/** @param {{ blocked?: boolean, seed?: Record<string, string> }} [opts] */
function env({ blocked = false, seed = {} } = {}) {
	const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
	const win = dom.window;
	if (blocked) {
		Object.defineProperty(win, 'localStorage', {
			configurable: true,
			get() {
				throw new win.DOMException('The operation is insecure.', 'SecurityError');
			}
		});
	} else {
		for (const [k, v] of Object.entries(seed)) win.localStorage.setItem(k, v);
	}
	win.eval(bundle);
	return { win, doc: win.document, fx: win.__fixture };
}

test('stores never touch localStorage without a guard', () => {
	assert.doesNotMatch(fontscale, /localStorage/);
	assert.doesNotMatch(themeSrc, /localStorage/);
	assert.match(storage, /try\s*{\s*return localStorage\.getItem\(key\);\s*}\s*catch\s*{\s*return null;\s*}/);
	assert.match(storage, /try\s*{\s*localStorage\.setItem\(key, value\);\s*}\s*catch\s*{}/);
});

test('blocked storage: stores load with defaults and writes do not throw', () => {
	const { fx, doc } = env({ blocked: true });
	assert.equal(fx.fontScale.levelId, 'normal');
	assert.equal(doc.documentElement.style.getPropertyValue('--fs-scale'), '1');
	assert.doesNotThrow(() => fx.fontScale.set('large'));
	assert.equal(fx.fontScale.levelId, 'large');
	assert.equal(doc.documentElement.style.getPropertyValue('--fs-scale'), '1.2');
	assert.equal(typeof fx.theme.current, 'string');
	assert.equal(doc.documentElement.getAttribute('data-theme'), fx.theme.current);
	assert.doesNotThrow(() => fx.theme.toggle());
});

test('working storage: the saved font scale is still restored and persisted', () => {
	const { fx, win } = env({ seed: { 'tsumikit-font-scale': 'small' } });
	assert.equal(fx.fontScale.levelId, 'small');
	fx.fontScale.set('largest');
	assert.equal(win.localStorage.getItem('tsumikit-font-scale'), 'largest');
});

/** @param {Record<string, unknown>} props */
function renderSelectButton(props) {
	const { doc, fx } = env();
	fx.mount(fx.SelectButton, { target: doc.body, props });
	fx.flushSync();
	return /** @type {HTMLElement} */ (doc.body.querySelector('[data-tsu="SelectButton"]'));
}

const options = [
	{ value: 'a', label: 'Alpha' },
	{ value: 'b', label: 'Beta' }
];

test('SelectButton: the select is the only focusable control and is not nested in the button', () => {
	assert.doesNotMatch(selectButton, /<Button[^>]*>(?:(?!<\/Button>)[\s\S])*<Select/);
	const root = renderSelectButton({ glyph: 'A', label: 'Font size', title: 'Font size', value: 'a', options, onchange() {} });
	const select = /** @type {HTMLSelectElement} */ (root.querySelector('select'));
	const button = /** @type {HTMLButtonElement} */ (root.querySelector('button'));
	assert.ok(select && button);
	assert.equal(select.closest('button'), null);
	assert.ok(button.hasAttribute('inert'));
	assert.equal(button.tabIndex, -1);
	assert.equal(button.getAttribute('aria-label'), null);
	assert.equal(select.getAttribute('aria-label'), 'Font size');
	assert.equal(select.getAttribute('title'), 'Font size');
	const tabStops = Array.from(root.querySelectorAll('*')).filter(
		(el) => /** @type {HTMLElement} */ (el).tabIndex >= 0 && !el.closest('[inert]')
	);
	assert.deepEqual(tabStops, [select]);
	assert.deepEqual(Array.from(select.options, (o) => o.value), ['a', 'b']);
	assert.equal(select.value, 'a');
});

test('SelectButton: change still reports the picked value; row variant keeps its label', () => {
	/** @type {string[]} */
	const got = [];
	const root = renderSelectButton({ glyph: 'A', label: 'Pick', value: 'a', options, onchange: (/** @type {string} */ v) => got.push(v) });
	const select = /** @type {HTMLSelectElement} */ (root.querySelector('select'));
	select.value = 'b';
	select.dispatchEvent(new (/** @type {Window} */ (root.ownerDocument.defaultView)).Event('change', { bubbles: true }));
	assert.deepEqual(got, ['b']);

	const row = renderSelectButton({ icon: 'palette', variant: 'row', label: 'Theme', value: 'a', options, onchange() {} });
	assert.equal(row.querySelector('.sb-label')?.textContent, 'Theme');
	assert.equal(row.querySelectorAll('[aria-label]').length, 1);
});
