import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-textarea-mirror.js');

const MIRROR = '[data-tsu="TextareaMirror"]';

/** @param {Record<string, unknown>} props */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const { window } = dom;
	window.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
	window.eval(bundle);
	const { mount, flushSync, Fixture } = window.__fixture;
	const api = mount(Fixture, { target: window.document.body, props });
	flushSync();
	const $ = (/** @type {string} */ sel) => {
		const el = window.document.querySelector(sel);
		assert.ok(el, `missing ${sel}`);
		return /** @type {HTMLElement} */ (el);
	};
	const ta = () => /** @type {HTMLTextAreaElement} */ ($('textarea'));
	return { window, flushSync, $, ta, api };
}

/** `.tail` holds the zero-width line keeper, not value text. */
const overlayText = (/** @type {HTMLElement} */ mirror) =>
	[...mirror.querySelectorAll('span:not(.tail)')].map((s) => s.textContent).join('');

test('without `segments` the Textarea renders no overlay and no mirrored classes', () => {
	const { window, ta } = render({ mirrored: false });
	assert.equal(window.document.querySelector(MIRROR), null);
	assert.ok(!ta().classList.contains('mirrored'));
	assert.ok(!ta().closest('[data-tsu="Textarea"]')?.classList.contains('mirrored'));
});

test('overlay renders every segment, masks the tagged span and concatenates back to the value', () => {
	const value = 'line one\nkey <redacted>hunter2</redacted> end\n';
	const { $, ta } = render({ value });
	const mirror = $(MIRROR);
	assert.equal(mirror.getAttribute('aria-hidden'), 'true');
	assert.equal(overlayText(mirror), value);
	const masked = [...mirror.querySelectorAll('.masked')];
	assert.deepEqual(
		masked.map((m) => m.textContent),
		['hunter2']
	);
	assert.deepEqual(
		[...mirror.querySelectorAll('.tag')].map((m) => m.textContent),
		['<redacted>', '</redacted>']
	);
	assert.ok(ta().classList.contains('mirrored'));
	assert.equal(ta().value, value, 'the textarea keeps the raw value');
	assert.equal(mirror.lastElementChild?.textContent, '​');
	assert.equal(mirror.compareDocumentPosition(ta()) & 4, 4, 'overlay precedes the textarea');
});

test('typing updates the overlay through bind:value', () => {
	const { window, flushSync, $, ta } = render({ value: 'a <redacted>b</redacted>' });
	const field = ta();
	field.value = 'a <redacted>bcd</redacted>!';
	field.dispatchEvent(new window.Event('input', { bubbles: true }));
	flushSync();
	assert.equal(overlayText($(MIRROR)), 'a <redacted>bcd</redacted>!');
	assert.equal($(`${MIRROR} .masked`).textContent, 'bcd');
});

test('overlay follows the textarea scroll offset on scroll and input, and consumer handlers still fire', () => {
	const events = /** @type {string[]} */ ([]);
	const { window, $, ta } = render({
		value: 'x <redacted>y</redacted>',
		maxHeight: '4rem',
		oninput: () => events.push('input'),
		onscroll: () => events.push('scroll')
	});
	const field = ta();
	const mirror = $(MIRROR);
	field.scrollTop = 37;
	field.scrollLeft = 5;
	field.dispatchEvent(new window.Event('scroll'));
	assert.equal(mirror.scrollTop, 37);
	assert.equal(mirror.scrollLeft, 5);
	field.scrollTop = 12;
	field.dispatchEvent(new window.Event('input', { bubbles: true }));
	assert.equal(mirror.scrollTop, 12);
	assert.deepEqual(events, ['scroll', 'input']);
	assert.equal(mirror.getAttribute('style'), 'max-height: 4rem;', 'the overlay caps like the textarea');
});

test('rest props land on the textarea only; the overlay stays out of the a11y tree', () => {
	const { window, ta } = render({});
	const field = ta();
	assert.equal(field.getAttribute('data-testid'), 'ta');
	assert.equal(field.getAttribute('aria-label'), 'Mirrored');
	assert.equal(field.getAttribute('placeholder'), 'Type here');
	assert.equal(field.rows, 3);
	const mirror = window.document.querySelector(MIRROR);
	assert.ok(mirror);
	assert.equal(mirror.getAttribute('data-testid'), null);
	assert.equal(mirror.getAttribute('aria-label'), null);
});

test('autoresize and segments combine', () => {
	const { $, ta } = render({ autoresize: true, value: 'a\n<redacted>b</redacted>' });
	assert.ok(ta().classList.contains('mirrored'));
	assert.equal(overlayText($(MIRROR)), 'a\n<redacted>b</redacted>');
});

test('Composer forwards `segments` to its Textarea', () => {
	const { $ } = render({ composer: true, value: 'hi <redacted>pw</redacted>' });
	const mirror = $(`[data-tsu="Composer"] ${MIRROR}`);
	assert.equal(overlayText(mirror), 'hi <redacted>pw</redacted>');
	assert.equal($(`${MIRROR} .masked`).textContent, 'pw');
});
