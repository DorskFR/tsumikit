import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import {
	acceptsRovingStop,
	consumesArrowKeys,
	isToolbarNavKey,
	nextToolbarStop,
	TOOLBAR_STOP_ATTR,
	TOOLBAR_STOP_SELECTOR,
	toolbarStops,
} from '../src/lib/components/layouts/toolbar-roving.js';

test('arrow navigation wraps in both directions', () => {
	assert.equal(nextToolbarStop(4, 0, 'ArrowRight'), 1);
	assert.equal(nextToolbarStop(4, 3, 'ArrowRight'), 0);
	assert.equal(nextToolbarStop(4, 0, 'ArrowLeft'), 3);
	assert.equal(nextToolbarStop(4, 2, 'ArrowLeft'), 1);
	assert.equal(nextToolbarStop(4, 0, 'ArrowDown'), 1);
	assert.equal(nextToolbarStop(4, 0, 'ArrowUp'), 3);
});

test('Home and End jump to the ends', () => {
	assert.equal(nextToolbarStop(4, 2, 'Home'), 0);
	assert.equal(nextToolbarStop(4, 1, 'End'), 3);
	assert.equal(nextToolbarStop(1, 0, 'End'), 0);
});

test('unhandled keys and focus outside the ring keep native behaviour', () => {
	assert.equal(nextToolbarStop(4, 0, 'Enter'), undefined);
	assert.equal(nextToolbarStop(4, 0, 'Tab'), undefined);
	assert.equal(nextToolbarStop(4, -1, 'ArrowRight'), undefined);
	assert.equal(nextToolbarStop(4, 4, 'Home'), undefined);
	assert.equal(nextToolbarStop(0, 0, 'ArrowRight'), undefined);
});

test('navigation keys are exactly the arrows plus Home/End', () => {
	for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']) {
		assert.equal(isToolbarNavKey(key), true, key);
	}
	for (const key of ['Enter', ' ', 'Tab', 'Escape', 'PageUp', 'a']) {
		assert.equal(isToolbarNavKey(key), false, key);
	}
});

test('disabled, hidden and aria-hidden controls leave the ring', () => {
	assert.equal(acceptsRovingStop({}), true);
	assert.equal(acceptsRovingStop({ disabled: true }), false);
	assert.equal(acceptsRovingStop({ hidden: true }), false);
	assert.equal(acceptsRovingStop({ ariaHidden: true }), false);
});

test('popover content is never a toolbar stop', () => {
	assert.equal(acceptsRovingStop({ inPopover: true }), false);
	assert.equal(acceptsRovingStop({ inPopover: true, claimed: true }), false);
});

test("the author's own tabindex=-1 is honoured, the toolbar's is not mistaken for it", () => {
	assert.equal(acceptsRovingStop({ tabindex: '-1' }), false);
	assert.equal(acceptsRovingStop({ tabindex: '0' }), true);
	assert.equal(acceptsRovingStop({ tabindex: null }), true);
	assert.equal(acceptsRovingStop({ tabindex: '-1', claimed: true }), true);
});

test('controls that own the arrow keys keep them', () => {
	assert.equal(consumesArrowKeys({ tagName: 'BUTTON' }), false);
	assert.equal(consumesArrowKeys({ tagName: 'A' }), false);
	assert.equal(consumesArrowKeys({ tagName: 'INPUT', type: 'checkbox' }), false);
	assert.equal(consumesArrowKeys({ tagName: 'INPUT', type: 'text' }), true);
	assert.equal(consumesArrowKeys({ tagName: 'INPUT', type: 'search' }), true);
	assert.equal(consumesArrowKeys({ tagName: 'INPUT', type: 'number' }), true);
	assert.equal(consumesArrowKeys({ tagName: 'INPUT', type: 'range' }), true);
	assert.equal(consumesArrowKeys({ tagName: 'INPUT' }), true);
	assert.equal(consumesArrowKeys({ tagName: 'TEXTAREA' }), true);
	assert.equal(consumesArrowKeys({ tagName: 'SELECT' }), true);
	assert.equal(consumesArrowKeys({ tagName: 'DIV', isContentEditable: true }), true);
	assert.equal(consumesArrowKeys(null), false);
});

test('the stop selector covers the natively focusable controls a toolbar holds', () => {
	for (const part of ['button', 'a[href]', 'input', 'select', 'textarea', '[tabindex]']) {
		assert.ok(TOOLBAR_STOP_SELECTOR.includes(part), part);
	}
});

/** jsdom has no layout, so collapse is expressed with an explicit marker. */
const bar = (/** @type {string} */ html) =>
	new JSDOM(`<div id="bar">${html}</div>`).window.document.getElementById('bar');
const stops = (/** @type {Element | null} */ container) =>
	toolbarStops(container, (node) => node.hasAttribute('data-collapsed')).map(
		(node) => node.getAttribute('data-id') ?? node.tagName
	);

test('the ring is the visible, enabled controls in DOM order', () => {
	const container = bar(`
		<button data-id="a"></button>
		<a href="#x" data-id="b"></a>
		<span data-id="not-focusable"></span>
		<input data-id="c" />
		<button data-id="d" disabled></button>
		<button data-id="e" data-collapsed></button>
		<button data-id="f" aria-hidden="true"></button>
		<button data-id="g" hidden></button>
		<button data-id="more"></button>`);
	assert.deepEqual(stops(container), ['a', 'b', 'c', 'more']);
});

test('the overflow trigger is the last stop and its panel contents are not stops', () => {
	const container = bar(`
		<button data-id="a"></button>
		<button data-id="more"></button>
		<div popover><button data-id="in-panel"></button></div>`);
	assert.deepEqual(stops(container), ['a', 'more']);
});

test('a control the toolbar already claimed stays in the ring at tabindex -1', () => {
	const container = bar(`
		<button data-id="a" tabindex="0" ${TOOLBAR_STOP_ATTR}></button>
		<button data-id="b" tabindex="-1" ${TOOLBAR_STOP_ATTR}></button>
		<button data-id="opted-out" tabindex="-1"></button>`);
	assert.deepEqual(stops(container), ['a', 'b']);
});

test('a collapsed child rejoins the ring when it is shown again', () => {
	const container = bar(`
		<button data-id="a"></button>
		<button data-id="b" data-overflow data-collapsed ${TOOLBAR_STOP_ATTR} tabindex="-1"></button>
		<button data-id="more"></button>`);
	assert.deepEqual(stops(container), ['a', 'more']);
	container?.querySelector('[data-overflow]')?.removeAttribute('data-collapsed');
	assert.deepEqual(stops(container), ['a', 'b', 'more']);
});

test('arrowing right from the last stop lands back on the first', () => {
	const container = bar(`
		<button data-id="a"></button>
		<button data-id="b" disabled></button>
		<button data-id="c"></button>`);
	const ring = stops(container);
	assert.deepEqual(ring, ['a', 'c']);
	assert.equal(ring[/** @type {number} */ (nextToolbarStop(ring.length, 1, 'ArrowRight'))], 'a');
	assert.equal(ring[/** @type {number} */ (nextToolbarStop(ring.length, 0, 'ArrowRight'))], 'c');
});

test('an empty or absent bar yields no stops', () => {
	assert.deepEqual(stops(bar('')), []);
	assert.deepEqual(stops(null), []);
});

const toolbar = await readFile(
	new URL('../src/lib/components/layouts/Toolbar.svelte', import.meta.url),
	'utf8'
);

test('Toolbar wires the roving ring to the bar and ties the role to it (TSU-127)', () => {
	assert.match(toolbar, /roving\?: boolean;/);
	assert.match(toolbar, /roving = true,/);
	assert.match(toolbar, /role={roving \? 'toolbar' : undefined}/);
	assert.match(toolbar, /aria-label={roving \? label : undefined}/);
	assert.match(toolbar, /onkeydown={onKeydown}/);
	assert.match(toolbar, /onfocusin={onFocusin}/);
	assert.match(toolbar, /node\.tabIndex = i === index \? 0 : -1;/);
	assert.match(toolbar, /node\.setAttribute\(TOOLBAR_STOP_ATTR, ''\);/);
	assert.match(toolbar, /if \(consumesArrowKeys\(target\)\) return;/);
	assert.match(toolbar, /event\.preventDefault\(\);\s*rove\(list, next\);\s*list\[next\]\.focus\(\);/);
});

test('the ring is re-read from the DOM as children collapse or change', () => {
	assert.match(toolbar, /new MutationObserver\(sync\)/);
	assert.match(toolbar, /attributeFilter: \['disabled', 'hidden', 'aria-hidden', 'class', 'style'\]/);
	assert.match(toolbar, /toolbarStops\(el, \(node\) => node\.getClientRects\(\)\.length === 0\)/);
	assert.match(toolbar, /class:collapsed/);
});
