import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-duplicate-labels.js');
const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/** @param {string} which */
function render(which) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const win = /** @type {any} */ (dom.window);
	const proto = win.HTMLElement.prototype;
	/** @param {HTMLElement} el @param {'open' | 'closed'} newState */
	const toggle = (el, newState) => {
		const e = new win.Event('toggle');
		Object.assign(e, { oldState: newState === 'open' ? 'closed' : 'open', newState });
		el.dispatchEvent(e);
	};
	proto.showPopover = function () {
		this.setAttribute('data-popover-open', '');
		toggle(this, 'open');
	};
	proto.hidePopover = function () {
		this.removeAttribute('data-popover-open');
		toggle(this, 'closed');
	};
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	mount(Fixture, { target: win.document.body, props: { which } });
	flushSync();
	const doc = /** @type {Document} */ (win.document);
	const openPopover = () => {
		/** @type {HTMLElement} */ (doc.querySelector('[popover]')).showPopover();
		flushSync();
	};
	return { win, doc, flush: flushSync, openPopover };
}

/** @param {Document} doc @param {string} sel */
const texts = (doc, sel) => [...doc.querySelectorAll(sel)].map((el) => el.textContent?.trim());

test('Menu renders two items with the same label', () => {
	const { doc, openPopover } = render('Menu');
	openPopover();
	assert.deepEqual(texts(doc, '[role="menuitem"]'), ['Japanese', 'Japanese']);
});

test('Menu rows keyed by id follow their item when the list reorders', () => {
	const { doc, flush, openPopover } = render('MenuIds');
	openPopover();
	const [first, second] = doc.querySelectorAll('[role="menuitem"]');
	/** @type {HTMLElement} */ (doc.getElementById('reverse')).click();
	flush();
	assert.deepEqual([...doc.querySelectorAll('[role="menuitem"]')], [second, first]);
});

test('RadialMenu renders two petals with the same label', () => {
	const { doc } = render('RadialMenu');
	assert.deepEqual(texts(doc, '.radial-petal .radial-label'), ['Japanese', 'Japanese']);
});

test('SelectButton renders two groups with the same label', () => {
	const { doc } = render('SelectButton');
	assert.deepEqual(
		[...doc.querySelectorAll('optgroup')].map((g) => g.getAttribute('label')),
		['Japanese', 'Japanese']
	);
});

test('Select keeps a group named like an index apart from an ungrouped section', () => {
	const { doc } = render('Select');
	assert.deepEqual(texts(doc, 'option'), ['A', 'B']);
	assert.equal(doc.querySelector('optgroup')?.getAttribute('label'), '-1');
});

test('EmojiPicker search lists a glyph found in two groups twice', () => {
	const { win, doc, flush, openPopover } = render('EmojiPicker');
	openPopover();
	const search = /** @type {HTMLInputElement} */ (doc.querySelector('input'));
	search.value = 'crab';
	search.dispatchEvent(new win.Event('input', { bubbles: true }));
	flush();
	assert.deepEqual(texts(doc, '[role="option"]'), ['🦀', '🦀']);
});

test('FilterInput suggestions whose insert + index collide still render', async () => {
	const { doc, flush } = render('FilterInput');
	const input = /** @type {HTMLInputElement} */ (doc.querySelector('input.fi__input'));
	input.setSelectionRange(input.value.length, input.value.length);
	input.focus();
	await wait(20);
	flush();
	assert.equal(doc.querySelectorAll('.fi__opt').length, 11);
});

test('Progress renders two markers at the same position', () => {
	const { doc } = render('Progress');
	assert.deepEqual(
		[...doc.querySelectorAll('.marker')].map((m) => m.getAttribute('title')),
		['OP', 'ED']
	);
});

test('Slider renders repeated tick positions', () => {
	const { doc } = render('SliderTicks');
	assert.equal(doc.querySelectorAll('.tick').length, 3);
});

test('Slider renders two marks at the same value', () => {
	const { doc } = render('SliderMarks');
	assert.deepEqual(texts(doc, '.mark'), ['Half', 'Mid']);
});
