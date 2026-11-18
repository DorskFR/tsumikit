import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { comboboxAction } from '../src/lib/components/molecules/combobox-keyboard.js';
import { isComposing } from '../src/lib/ime.js';
import { buildFixture } from './fixtures/build.mjs';

const [bundle, comboBundle] = await Promise.all([buildFixture('mount-ime.js'), buildFixture('mount-combobox.js')]);

/** @type {Array<[string, KeyboardEventInit]>} */
const COMPOSING = [
	['isComposing', { isComposing: true }],
	['keyCode 229', { keyCode: 229 }]
];

/** @param {string} b */
function dom(b) {
	const d = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
	d.window.eval(b);
	return d;
}

/**
 * @param {JSDOM} d
 * @param {Element} el
 * @param {string} key
 * @param {KeyboardEventInit} [init]
 */
function press(d, el, key, init = {}) {
	const e = new d.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
	el.dispatchEvent(e);
	d.window.__fixture.flushSync();
	return e;
}

/** @param {string} name @param {Record<string, unknown>} props @param {string} selector */
function render(name, props, selector) {
	const d = dom(bundle);
	const { mount, flushSync } = d.window.__fixture;
	mount(d.window.__fixture[name], { target: d.window.document.body, props });
	flushSync();
	const el = d.window.document.querySelector(selector);
	assert.ok(el, selector);
	return { d, el };
}

test('isComposing covers the standard flag and the Safari keyCode 229 fallback', () => {
	assert.equal(isComposing({ isComposing: true }), true);
	assert.equal(isComposing({ isComposing: false, keyCode: 229 }), true);
	assert.equal(isComposing({ isComposing: false, keyCode: 13 }), false);
	assert.equal(isComposing({}), false);
});

for (const [label, init] of COMPOSING) {
	test(`Input: composing Enter (${label}) fires neither onenter nor onsubmit`, () => {
		/** @type {unknown[]} */
		const calls = [];
		const { d, el } = render(
			'Input',
			{ 'aria-label': 'Name', value: '日本', onenter: (/** @type {string} */ v) => calls.push(['enter', v]), onsubmit: (/** @type {string} */ v) => calls.push(['submit', v]) },
			'input'
		);
		press(d, el, 'Enter', init);
		assert.deepEqual(calls, []);
		press(d, el, 'Enter');
		assert.deepEqual(calls, [['enter', '日本'], ['submit', '日本']]);
	});

	test(`Textarea submitOn=enter: composing Enter (${label}) does not submit`, () => {
		/** @type {unknown[]} */
		const calls = [];
		const { d, el } = render(
			'Textarea',
			{ 'aria-label': 'Message', value: '日本', submitOn: 'enter', onsubmit: (/** @type {string} */ v) => calls.push(v) },
			'textarea'
		);
		assert.equal(press(d, el, 'Enter', init).defaultPrevented, false);
		assert.deepEqual(calls, []);
		assert.equal(press(d, el, 'Enter').defaultPrevented, true);
		assert.deepEqual(calls, ['日本']);
	});

	test(`Composer: composing Enter (${label}) does not send`, () => {
		/** @type {unknown[]} */
		const calls = [];
		const { d, el } = render(
			'Composer',
			{ 'aria-label': 'Message', value: '日本', submitOn: 'enter', onsubmit: (/** @type {string} */ v) => calls.push(v) },
			'textarea'
		);
		assert.equal(press(d, el, 'Enter', init).defaultPrevented, false);
		assert.deepEqual(calls, []);
		press(d, el, 'Enter');
		assert.deepEqual(calls, ['日本']);
	});

	test(`FilterInput: composing Enter (${label}) neither submits nor accepts a suggestion`, async () => {
		/** @type {unknown[]} */
		const calls = [];
		const provider = async () => [{ value: '/srv/app', label: 'app' }];
		const { d, el } = render(
			'FilterInput',
			{
				'aria-label': 'Working directory',
				key: 'cwd',
				schema: { fields: [{ name: 'cwd', label: 'Working directory', type: 'string', provider }] },
				onsubmit: (/** @type {string} */ v) => calls.push(v)
			},
			'input.fi__input'
		);
		const settle = async () => {
			await new Promise((r) => d.window.setTimeout(r, 0));
			d.window.__fixture.flushSync();
		};
		const input = /** @type {HTMLInputElement} */ (el);
		input.focus();
		await settle();
		const menu = () => d.window.document.querySelector('.fi__menu');
		assert.ok(menu(), 'menu opens on focus');

		for (const key of ['Enter', 'Tab', 'ArrowDown']) {
			assert.equal(press(d, input, key, init).defaultPrevented, false, key);
			await settle();
		}
		assert.ok(menu(), 'menu stays open');
		assert.equal(input.value, '');
		press(d, input, 'Enter');
		await settle();
		assert.equal(input.value.trim(), '/srv/app');

		press(d, input, 'Escape');
		await settle();
		assert.equal(menu(), null);
		press(d, input, 'Enter', init);
		await settle();
		assert.deepEqual(calls, []);
		press(d, input, 'Enter');
		await settle();
		assert.equal(calls.length, 1);
	});

	test(`comboboxAction: every key belongs to the IME while composing (${label})`, () => {
		const state = { open: true, count: 3, index: 1 };
		for (const key of ['Enter', 'Tab', 'ArrowDown', 'ArrowUp', 'Escape']) {
			assert.equal(comboboxAction({ key, ...init }, state), undefined, key);
		}
		assert.deepEqual(comboboxAction({ key: 'Enter' }, state), { type: 'select' });
	});

	test(`Combobox: composing Enter (${label}) does not pick the highlighted option`, () => {
		const d = dom(comboBundle);
		/** @type {string[]} */
		const picked = [];
		const { mount, flushSync, Fixture } = d.window.__fixture;
		mount(Fixture, { target: d.window.document.body, props: { onselect: (/** @type {string} */ o) => picked.push(o) } });
		flushSync();
		const field = d.window.document.querySelector('input');
		assert.ok(field);
		assert.equal(press(d, field, 'Enter', init).defaultPrevented, false);
		assert.deepEqual(picked, []);
		assert.equal(d.window.__cbctl.state().open, true);
		press(d, field, 'Enter');
		assert.deepEqual(picked, ['apple']);
	});
}
