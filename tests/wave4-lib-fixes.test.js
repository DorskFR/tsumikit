import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { compile, preprocess } from 'svelte/compiler';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { placeAt } from '../src/lib/floating.ts';
import { buildFixture } from './fixtures/build.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [floating, richSelect, input, textarea, selectButton] = await Promise.all([
	read('floating.ts'),
	read('components/molecules/RichSelect.svelte'),
	read('components/atoms/Input.svelte'),
	read('components/atoms/Textarea.svelte'),
	read('components/molecules/SelectButton.svelte'),
]);

const rect = (/** @type {number} */ top, /** @type {number} */ left, /** @type {number} */ width, /** @type {number} */ height) => ({ top, left, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) });

function floatingDom(/** @type {number} */ vw, /** @type {number} */ vh) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
	const w = dom.window;
	Object.defineProperty(w.document.documentElement, 'clientWidth', { value: vw, configurable: true });
	Object.defineProperty(w.document.documentElement, 'clientHeight', { value: vh, configurable: true });
	globalThis.document = w.document;
	const panel = (/** @type {{ layout: number[]; rendered: number[] }} */ { layout, rendered }) => {
		const el = w.document.createElement('div');
		w.document.body.appendChild(el);
		Object.defineProperty(el, 'offsetWidth', { value: layout[0] });
		Object.defineProperty(el, 'offsetHeight', { value: layout[1] });
		el.getBoundingClientRect = () => /** @type {DOMRect} */ (rect(0, 0, rendered[0], rendered[1]));
		return el;
	};
	return { panel, done: () => Reflect.deleteProperty(globalThis, 'document') };
}

test('placeAt measures the untransformed layout size, not the enter-scaled rect', () => {
	const { panel, done } = floatingDom(1440, 900);
	try {
		const scaled = { layout: [320, 305], rendered: [307.2, 292.8] };
		const p1 = panel(scaled);
		Object.defineProperty(globalThis.document.documentElement, 'clientHeight', { value: 600, configurable: true });
		placeAt(rect(280, 100, 200, 30), p1, 'bottom-start', 6);
		assert.equal(p1.style.top, '289px', 'no room above, so the clamp uses the 305px height: 600 - 305 - 6');
		assert.equal(p1.style.left, '100px');

		const p2 = panel(scaled);
		Object.defineProperty(globalThis.document.documentElement, 'clientHeight', { value: 740, configurable: true });
		placeAt(rect(400, 100, 200, 30), p2, 'bottom-start', 6);
		assert.equal(p2.style.top, '89px', 'flips up because the true height overflows (436 + 305 > 740)');
		assert.equal(p2.dataset.side, 'top');

		const p3 = panel({ layout: [320, 305], rendered: [307.2, 292.8] });
		Object.defineProperty(globalThis.document.documentElement, 'clientWidth', { value: 400, configurable: true });
		placeAt(rect(100, 300, 40, 30), p3, 'bottom-start', 6);
		assert.equal(p3.style.left, '74px', 'horizontal clamp uses the 320px width: 400 - 320 - 6');
	} finally {
		done();
	}
});

test('placeAt falls back to the client rect when offset sizes are unavailable', () => {
	const { panel, done } = floatingDom(1000, 800);
	try {
		const p = panel({ layout: [0, 0], rendered: [200, 100] });
		placeAt(rect(700, 0, 100, 30), p, 'bottom-start', 6);
		assert.equal(p.style.top, '594px', 'flipped above using the 100px rect height');
		assert.match(floating, /el\.offsetWidth \|\| width, height: el\.offsetHeight \|\| height/);
		assert.doesNotMatch(floating, /const f = floating\.getBoundingClientRect\(\)/);
	} finally {
		done();
	}
});

function popoverDom(/** @type {string} */ bundle, /** @type {string} */ exportsName) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const win = /** @type {any} */ (dom.window);
	const proto = win.HTMLElement.prototype;
	const toggle = (/** @type {any} */ el, /** @type {string} */ newState) => {
		const e = new win.Event('toggle');
		Object.assign(e, { oldState: newState === 'open' ? 'closed' : 'open', newState });
		el.dispatchEvent(e);
	};
	proto.showPopover = function () {
		if (this.hasAttribute('data-open')) return;
		this.setAttribute('data-open', '');
		toggle(this, 'open');
	};
	proto.hidePopover = function () {
		if (!this.hasAttribute('data-open')) return;
		this.removeAttribute('data-open');
		toggle(this, 'closed');
	};
	/** @type {[any, any][]} */
	const scrolled = [];
	proto.scrollIntoView = function (/** @type {any} */ arg) {
		scrolled.push([this, arg]);
	};
	win.eval(bundle);
	return { win, doc: win.document, fixture: win[exportsName], scrolled };
}

const richBundle = await buildFixture('mount-rich-select.js');

test('opening RichSelect never calls scrollIntoView; the active row is revealed by scrolling the listbox', async () => {
	const { win, doc, fixture, scrolled } = popoverDom(richBundle, '__fixture');
	const { mount, flushSync, Fixture } = fixture;
	mount(Fixture, { target: doc.body, props: {} });
	flushSync();
	const trigger = doc.querySelector('.rs-trigger');
	const key = (/** @type {string} */ k) => {
		trigger.dispatchEvent(new win.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
		flushSync();
	};
	const settle = async () => {
		await new Promise((r) => setTimeout(r, 0));
		flushSync();
	};

	key('Enter');
	await settle();
	assert.ok(doc.querySelector('.rs-panel').hasAttribute('data-open'));
	assert.equal(scrolled.length, 0, 'no scrollIntoView on open');
	const list = doc.querySelector('.rs-list');
	const rows = [...doc.querySelectorAll('.rs-row')];
	assert.equal(rows.length, 4);
	Object.defineProperty(list, 'clientHeight', { value: 100 });
	rows.forEach((row, i) => {
		Object.defineProperty(row, 'offsetTop', { value: i * 40 });
		Object.defineProperty(row, 'offsetHeight', { value: 40 });
	});
	assert.equal(list.scrollTop, 0);

	key('End');
	await settle();
	assert.equal(list.scrollTop, 60, 'last row (120..160) brought to the bottom edge of a 100px list');
	key('Home');
	await settle();
	assert.equal(list.scrollTop, 0, 'first row brought back to the top edge');
	assert.equal(scrolled.length, 0, 'still no scrollIntoView while moving');
	assert.doesNotMatch(richSelect, /scrollIntoView\??\.?\(/);
	assert.match(richSelect, /\.rs-list \{\s*position: relative;/);
});

test('RichSelect text placeholder shares the card inset', () => {
	const block = richSelect.match(/\.rs-placeholder \{([^}]*)\}/)?.[1] ?? '';
	assert.ok(block.length);
	assert.doesNotMatch(block, /padding/);
});

test('Input and Textarea omit the native onsubmit attribute so the handler is (value: string) => void', async () => {
	assert.match(input, /type Props = Omit<HTMLInputAttributes, 'size' \| 'onsubmit'> & \{/);
	assert.match(input, /onsubmit\?: \(value: string\) => void;/);
	assert.match(textarea, /type Props = Omit<HTMLTextareaAttributes, 'onsubmit'> & \{/);
	assert.match(textarea, /onsubmit\?: \(value: string\) => void;/);
	for (const [name, source] of [['Input.svelte', input], ['Textarea.svelte', textarea], ['SelectButton.svelte', selectButton]]) {
		const { code } = await preprocess(source, vitePreprocess(), { filename: name });
		for (const generate of /** @type {const} */ (['client', 'server'])) {
			const out = compile(code, { generate, filename: name });
			assert.equal(out.warnings.length, 0, `${name} ${generate}: ${out.warnings.map((w) => w.message).join('; ')}`);
		}
	}
});

const sbBundle = await buildFixture('mount-stores-select-button.js');

test('SelectButton disabled prop reaches the native select and dims the control', () => {
	const { doc, fixture } = popoverDom(sbBundle, '__fixture');
	const { mount, flushSync, SelectButton } = fixture;
	const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }];
	const props = { label: 'Pick', value: 'a', options, onchange: () => {} };
	mount(SelectButton, { target: doc.body, props });
	mount(SelectButton, { target: doc.body, props: { ...props, disabled: true } });
	flushSync();
	const [plain, off] = [...doc.querySelectorAll('[data-tsu="SelectButton"]')];
	assert.equal(plain.querySelector('select').disabled, false);
	assert.equal(plain.classList.contains('disabled'), false);
	assert.equal(off.querySelector('select').disabled, true);
	assert.ok(off.classList.contains('disabled'));
	assert.match(selectButton, /disabled\?: boolean;/);
	assert.match(selectButton, /disabled = false,/);
	assert.match(selectButton, /\.select-button\.disabled \{\s*opacity: var\(--disabled-opacity\);\s*cursor: not-allowed;/);
	assert.match(selectButton, /\.select-button:not\(\.disabled\):hover :global\(\.btn-ghost\)/);
	assert.match(selectButton, /\.select-button\.disabled:active :global\(\.btn-ghost\) \{\s*scale: none;/);
});
