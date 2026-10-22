import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(p, import.meta.url), 'utf8');
const [feedBundle, glyphSource, legacy] = await Promise.all([
	buildFixture('mount-conversation.svelte.js'),
	read('../src/lib/components/molecules/GlyphStack.svelte'),
	read('../src/routes/legacy/+page.svelte'),
]);
const glyphCss = glyphSource.slice(glyphSource.indexOf('<style>'));
const legacyCss = legacy.slice(legacy.indexOf('<style>'));

function renderFeed() {
	const dom = new JSDOM('<!doctype html><html style="font-size:16px"><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
	});
	const win = /** @type {any} */ (dom.window);
	win.ResizeObserver = class {
		observe() {}
		disconnect() {}
	};
	win.HTMLElement.prototype.scrollTo = function () {};
	win.eval(feedBundle);
	const { mount, flushSync, Fixture, props } = win.__fixture;
	mount(Fixture, { target: win.document.body, props: props({ items: [{ id: 1, text: 'one' }] }) });
	flushSync();
	const doc = win.document;
	const scroller = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="ConversationFeed"] > .feed'));
	let scrollTop = 500;
	Object.defineProperty(scroller, 'clientHeight', { get: () => 300, configurable: true });
	Object.defineProperty(scroller, 'scrollTop', {
		get: () => scrollTop,
		set: (v) => (scrollTop = v),
		configurable: true,
	});
	scroller.getBoundingClientRect = () => /** @type {DOMRect} */ ({ top: 100, bottom: 400, left: 0, right: 300 });
	scroller.style.setProperty('scroll-padding-top', '8px');
	const pad = Number.parseFloat(win.getComputedStyle(scroller).scrollPaddingTop) || 0;
	const focusAt = (/** @type {number} */ top, /** @type {number} */ bottom, visible = true) => {
		const btn = doc.createElement('button');
		doc.querySelector('.feed-items').append(btn);
		btn.getBoundingClientRect = () => /** @type {DOMRect} */ ({ top, bottom, left: 10, right: 34 });
		const matches = btn.matches.bind(btn);
		btn.matches = (/** @type {string} */ s) => (s === ':focus-visible' ? visible : matches(s));
		btn.dispatchEvent(new win.FocusEvent('focusin', { bubbles: true }));
		btn.remove();
	};
	return { scroller, pad, focusAt, get scrollTop() {
		return scrollTop;
	}, set scrollTop(v) {
		scrollTop = v;
	} };
}

test('ConversationFeed scrolls a keyboard-focused control at the top edge inside its scroll padding', () => {
	const ui = renderFeed();
	assert.equal(ui.pad, 8);
	ui.focusAt(98, 122);
	assert.equal(ui.scrollTop, 500 - 2 - ui.pad);
});

test('ConversationFeed scrolls a keyboard-focused control at the bottom edge inside its scroll padding', () => {
	const ui = renderFeed();
	ui.focusAt(378, 402);
	assert.equal(ui.scrollTop, 500 + 2 + ui.pad);
});

test('ConversationFeed leaves the scroll alone for pointer focus and for controls well inside', () => {
	const ui = renderFeed();
	ui.focusAt(90, 114, false);
	assert.equal(ui.scrollTop, 500, 'pointer focus never scrolls the feed');
	ui.focusAt(200, 224);
	assert.equal(ui.scrollTop, 500, 'a ring with room to spare needs no scroll');
});

test('GlyphStack: folded cells draw focus rings inset and an expandable stack is a single press target', () => {
	assert.ok(
		hasDecl(glyphCss, '.stacked > :global(*) :global(:focus-visible),\n\t.stacked > :global(:focus-visible)', 'outline-offset', 'var(--focus-ring-offset-inset)'),
		'controls inside 1rem cells ring inset, so the cell overflow never cuts it',
	);
	assert.ok(hasDecl(glyphCss, '.glyph-stack[data-expand] > .cell', 'pointer-events', 'none'));
});

test('Legacy demo sidebar links ring inset and gate hover to fine pointers', () => {
	assert.ok(hasDecl(legacyCss, '.nav-link:focus-visible', 'outline-offset', 'var(--focus-ring-offset-inset)'));
	assert.doesNotMatch(legacyCss, /\n\t\.nav-link:hover \{/, 'no ungated hover rule at the top level');
	assert.match(legacyCss, /@media \(hover: hover\) and \(pointer: fine\) \{\s*\.nav-link:hover \{/);
});
