import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import {
	edgeScroll,
	edgeTarget,
	grabbedAction,
	moveItem,
	sameKeys,
	slotForTop,
	stepTarget
} from '../src/lib/components/molecules/sortable-list-order.js';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';
import { demoed, readDemo } from './helpers/demo-source.js';

/** @param {string} p */
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
const [source, index, readme, page] = await Promise.all([
	read('../src/lib/components/molecules/SortableList.svelte'),
	read('../src/lib/index.ts'),
	read('../README.md'),
	readDemo()
]);
const style = source.slice(source.indexOf('<style>'));
const bundle = await buildFixture('mount-sortable-list.js');

const RARES = [
	{ id: 'a', name: 'froglok crusader' },
	{ id: 'b', name: 'tsu ghoul wizard' },
	{ id: 'c', name: 'evil eye' },
	{ id: 'd', name: 'reanimated hand' }
];
const ROW_H = 30;
const LIST_TOP = 100;
const settle = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/** @param {Record<string, unknown>} props */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const win = dom.window;
	win.HTMLElement.prototype.getBoundingClientRect = function () {
		let top = 0;
		let height = 0;
		if (this.matches('li.sl-row')) {
			top = LIST_TOP + Array.from(this.parentElement?.children ?? []).indexOf(this) * ROW_H;
			height = ROW_H;
		} else if (this.matches('.sl-list')) {
			top = LIST_TOP;
			height = ROW_H * (this.children.length || 1);
		}
		return /** @type {DOMRect} */ ({ top, bottom: top + height, height, left: 0, right: 200, width: 200, x: 0, y: top, toJSON() {} });
	};
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	mount(Fixture, { target: win.document.body, props: { initial: RARES, ...props } });
	flushSync();
	const doc = win.document;
	/** @param {string} k */
	const rowOf = (k) => /** @type {HTMLElement} */ (doc.querySelector(`li[data-key="${k}"]`));
	/** @param {string} k @param {string} part */
	const part = (k, part) => /** @type {HTMLButtonElement} */ (rowOf(k).querySelector(`[data-part="${part}"]`));
	/** @param {string} type @param {number} y @param {EventTarget} target */
	const pointer = (type, y, target = doc.body) => {
		const Ctor = win.PointerEvent ?? win.MouseEvent;
		const e = new Ctor(type, { bubbles: true, cancelable: true, clientX: 10, clientY: y, button: 0 });
		Object.defineProperty(e, 'pointerId', { value: 1 });
		Object.defineProperty(e, 'pointerType', { value: 'mouse' });
		target.dispatchEvent(e);
		flushSync();
	};
	return {
		doc,
		win,
		flush: flushSync,
		rowOf,
		part,
		pointer,
		order: () => Array.from(doc.querySelectorAll('li.sl-row')).map((li) => /** @type {HTMLElement} */ (li).dataset.key),
		live: () => doc.querySelector('[role="status"]')?.textContent ?? '',
		/** @param {HTMLElement} el @param {string} key @param {Record<string, unknown>} [init] */
		key: (el, key, init = {}) => {
			el.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
			flushSync();
		}
	};
}

test('order helpers move, compare and find allowed targets', () => {
	assert.deepEqual(moveItem(['a', 'b', 'c'], 0, 2), ['b', 'c', 'a']);
	assert.deepEqual(moveItem(['a', 'b', 'c'], 2, 0), ['c', 'a', 'b']);
	assert.deepEqual(moveItem(['a', 'b', 'c'], 1, 9), ['a', 'c', 'b']);
	assert.ok(sameKeys(['a', 'b'], ['b', 'a']));
	assert.ok(!sameKeys(['a', 'b'], ['a', 'c']));
	const all = () => true;
	assert.equal(stepTarget(1, 4, -1, all), 0);
	assert.equal(stepTarget(0, 4, -1, all), undefined);
	assert.equal(stepTarget(1, 4, 1, (to) => to !== 2), 3);
	assert.equal(edgeTarget(2, 4, 'start', (to) => to !== 0), 1);
	assert.equal(edgeTarget(2, 4, 'end', all), 3);
	assert.equal(edgeTarget(3, 4, 'end', all), undefined);
	assert.equal(grabbedAction('ArrowUp'), 'up');
	assert.equal(grabbedAction(' '), 'drop');
	assert.equal(grabbedAction('Escape'), 'cancel');
	assert.equal(grabbedAction('Tab'), undefined);
	assert.equal(slotForTop(10, [30, 30, 30]), 0);
	assert.equal(slotForTop(16, [30, 30, 30]), 1);
	assert.equal(slotForTop(50, [30, 30, 30]), 2);
	assert.equal(slotForTop(500, [30, 30, 30]), 3);
	assert.equal(slotForTop(-40, [30, 30, 30]), 0);
	assert.equal(edgeScroll(105, 100, 500), -11);
	assert.equal(edgeScroll(300, 100, 500), 0);
	assert.ok(edgeScroll(499, 100, 500) > 0);
	assert.equal(edgeScroll(110, 100, 150), 0);
});

test('grip is a named button tied to the instructions; the list is labelled', () => {
	const ui = render();
	const list = /** @type {HTMLElement} */ (ui.doc.querySelector('ol.sl-list'));
	assert.equal(list.getAttribute('role'), 'list');
	assert.equal(list.getAttribute('aria-label'), 'Rare order');
	const grip = ui.part('a', 'grip');
	assert.equal(grip.tagName, 'BUTTON');
	assert.equal(grip.getAttribute('aria-label'), 'Reorder froglok crusader');
	assert.equal(grip.getAttribute('aria-pressed'), 'false');
	const help = ui.doc.getElementById(grip.getAttribute('aria-describedby') ?? '');
	assert.match(help?.textContent ?? '', /Space or Enter/);
	assert.equal(ui.part('a', 'up').getAttribute('aria-label'), 'Move froglok crusader up');
	assert.deepEqual(
		Array.from(ui.doc.querySelectorAll('.sl-ordinal')).map((o) => o.textContent),
		['1', '2', '3', '4']
	);
});

test('keyboard: Space grabs, arrows and End move, Enter drops and reports the move', async () => {
	/** @type {unknown[][]} */
	const calls = [];
	const ui = render({ onreorder: (/** @type {string[]} */ k, /** @type {unknown} */ m) => calls.push(JSON.parse(JSON.stringify([k, m]))) });
	const grip = ui.part('a', 'grip');
	grip.focus();
	ui.key(grip, ' ');
	assert.equal(grip.getAttribute('aria-pressed'), 'true');
	assert.equal(ui.live(), 'Grabbed froglok crusader, position 1 of 4.');
	ui.key(grip, 'ArrowDown');
	assert.deepEqual(ui.order(), ['b', 'a', 'c', 'd']);
	assert.equal(ui.live(), 'froglok crusader, position 2 of 4.');
	ui.key(ui.part('a', 'grip'), 'End');
	assert.deepEqual(ui.order(), ['b', 'c', 'd', 'a']);
	ui.key(ui.part('a', 'grip'), 'Home');
	ui.key(ui.part('a', 'grip'), 'ArrowDown');
	assert.equal(calls.length, 0, 'moving while grabbed does not commit');
	ui.key(ui.part('a', 'grip'), 'Enter');
	assert.deepEqual(calls, [[['b', 'a', 'c', 'd'], { key: 'a', from: 0, to: 1 }]]);
	assert.equal(ui.live(), 'Dropped froglok crusader at position 2 of 4.');
	assert.equal(ui.part('a', 'grip').getAttribute('aria-pressed'), 'false');
	await settle();
	assert.equal(ui.doc.activeElement, ui.part('a', 'grip'), 'focus follows the moved row');
});

test('keyboard: Escape cancels and restores the original order', () => {
	/** @type {unknown[]} */
	const calls = [];
	const ui = render({ onreorder: (/** @type {unknown} */ k) => calls.push(k) });
	const grip = ui.part('b', 'grip');
	grip.focus();
	ui.key(grip, 'Enter');
	ui.key(ui.part('b', 'grip'), 'ArrowDown');
	ui.key(ui.part('b', 'grip'), 'ArrowDown');
	assert.deepEqual(ui.order(), ['a', 'c', 'd', 'b']);
	ui.key(ui.part('b', 'grip'), 'Escape');
	assert.deepEqual(ui.order(), ['a', 'b', 'c', 'd']);
	assert.equal(calls.length, 0);
	assert.equal(ui.live(), 'Cancelled. tsu ghoul wizard is back at position 2 of 4.');
});

test('Alt+ArrowUp on a focused row moves it one step at once', async () => {
	/** @type {unknown[][]} */
	const calls = [];
	const ui = render({ onreorder: (/** @type {string[]} */ k, /** @type {unknown} */ m) => calls.push(JSON.parse(JSON.stringify([k, m]))) });
	const grip = ui.part('c', 'grip');
	grip.focus();
	ui.key(grip, 'ArrowUp', { altKey: true });
	assert.deepEqual(ui.order(), ['a', 'c', 'b', 'd']);
	assert.deepEqual(calls, [[['a', 'c', 'b', 'd'], { key: 'c', from: 2, to: 1 }]]);
	await settle();
	assert.equal(ui.doc.activeElement, ui.part('c', 'grip'));
});

test('arrow buttons move one step, disable at the ends and keep focus on the row', async () => {
	const ui = render();
	assert.ok(ui.part('a', 'up').disabled);
	assert.ok(ui.part('d', 'down').disabled);
	ui.part('b', 'down').click();
	ui.flush();
	assert.deepEqual(ui.order(), ['a', 'c', 'b', 'd']);
	assert.equal(ui.live(), 'tsu ghoul wizard, position 3 of 4.');
	await settle();
	assert.equal(ui.doc.activeElement, ui.part('b', 'down'));
});

test('canMove vetoes a target for keyboard, arrows and drag', () => {
	const ui = render({ canMove: (/** @type {string} */ _k, /** @type {number} */ to) => to !== 0 });
	assert.ok(ui.part('b', 'up').disabled, 'the only slot above is vetoed');
	const grip = ui.part('c', 'grip');
	grip.focus();
	ui.key(grip, ' ');
	ui.key(ui.part('c', 'grip'), 'Home');
	assert.deepEqual(ui.order(), ['a', 'c', 'b', 'd'], 'Home stops at the first allowed slot');
	ui.key(ui.part('c', 'grip'), 'ArrowUp');
	assert.deepEqual(ui.order(), ['a', 'c', 'b', 'd']);
	ui.key(ui.part('c', 'grip'), 'Escape');
	ui.pointer('pointerdown', LIST_TOP + 3 * ROW_H + 15, ui.part('d', 'grip'));
	for (const y of [195, 160, 130, 105]) ui.pointer('pointermove', y);
	assert.deepEqual(ui.order(), ['a', 'd', 'b', 'c'], 'drag stops short of the vetoed slot');
	ui.pointer('pointerup', LIST_TOP + 5);
});

test('locked rows have no grip and disabled arrows', () => {
	const ui = render({
		initial: [{ id: 'a', name: 'done', pinned: true }, ...RARES.slice(1)],
		pinned: true
	});
	assert.equal(ui.part('a', 'grip'), null);
	assert.ok(ui.rowOf('a').querySelector('.sl-grip-spacer'));
	assert.ok(ui.part('a', 'up').disabled);
	assert.ok(ui.part('a', 'down').disabled);
	assert.ok(!ui.part('b', 'down').disabled);
});

test('pointer: dragging the grip lifts the row, shows the slot and drops at the new index', () => {
	/** @type {unknown[][]} */
	const calls = [];
	const ui = render({ onreorder: (/** @type {string[]} */ k, /** @type {unknown} */ m) => calls.push(JSON.parse(JSON.stringify([k, m]))) });
	const start = LIST_TOP + 15;
	ui.pointer('pointerdown', start, ui.part('a', 'grip'));
	ui.pointer('pointermove', start + 2);
	assert.ok(!ui.rowOf('a').classList.contains('lifted'), 'a click-sized wobble does not start a drag');
	ui.pointer('pointermove', start + 10);
	assert.ok(ui.rowOf('a').classList.contains('lifted'));
	assert.equal(ui.live(), 'Grabbed froglok crusader, position 1 of 4.');
	assert.deepEqual(ui.order(), ['a', 'b', 'c', 'd'], 'a short move keeps the slot');
	ui.pointer('pointermove', start + 50);
	assert.deepEqual(ui.order(), ['b', 'c', 'a', 'd']);
	const lift = /** @type {HTMLElement} */ (ui.rowOf('a').querySelector('.sl-lift'));
	assert.equal(lift.style.transform, 'translateY(-10px)');
	ui.pointer('pointerup', start + 50);
	assert.ok(!ui.rowOf('a').classList.contains('lifted'));
	assert.deepEqual(calls, [[['b', 'c', 'a', 'd'], { key: 'a', from: 0, to: 2 }]]);
	assert.equal(ui.live(), 'Dropped froglok crusader at position 3 of 4.');
});

test('pointer: Escape and pointercancel restore the order', () => {
	/** @type {unknown[]} */
	const calls = [];
	const ui = render({ onreorder: (/** @type {unknown} */ k) => calls.push(k) });
	ui.pointer('pointerdown', LIST_TOP + 15, ui.part('a', 'grip'));
	ui.pointer('pointermove', LIST_TOP + 80);
	assert.notEqual(ui.order()[0], 'a');
	ui.key(ui.doc.body, 'Escape');
	assert.deepEqual(ui.order(), ['a', 'b', 'c', 'd']);
	ui.pointer('pointerdown', LIST_TOP + 15, ui.part('a', 'grip'));
	ui.pointer('pointermove', LIST_TOP + 80);
	ui.pointer('pointercancel', LIST_TOP + 80);
	assert.deepEqual(ui.order(), ['a', 'b', 'c', 'd']);
	assert.equal(calls.length, 0);
});

test('pointer: with handle="grip" the row body does not start a drag', () => {
	const ui = render();
	const body = /** @type {HTMLElement} */ (ui.rowOf('a').querySelector('.sl-body'));
	ui.pointer('pointerdown', LIST_TOP + 15, body);
	ui.pointer('pointermove', LIST_TOP + 80);
	assert.deepEqual(ui.order(), ['a', 'b', 'c', 'd']);
	ui.pointer('pointerup', LIST_TOP + 80);
});

test('controlled: the optimistic order falls back to items when the consumer does not adopt it', async () => {
	const ui = render({ adopt: false, revertAfter: 20 });
	ui.part('a', 'down').click();
	ui.flush();
	assert.deepEqual(ui.order(), ['b', 'a', 'c', 'd'], 'shown optimistically');
	await settle(40);
	ui.flush();
	assert.deepEqual(ui.order(), ['a', 'b', 'c', 'd']);
});

test('controlled: an adopted order stays', async () => {
	const ui = render({ revertAfter: 20 });
	ui.part('a', 'down').click();
	await settle(40);
	ui.flush();
	assert.deepEqual(ui.order(), ['b', 'a', 'c', 'd']);
});

test('clicking the row body selects it', () => {
	/** @type {string[]} */
	const picked = [];
	const ui = render({ onselect: (/** @type {string} */ k) => picked.push(k) });
	const body = /** @type {HTMLButtonElement} */ (ui.part('c', 'body'));
	assert.equal(body.tagName, 'BUTTON');
	body.click();
	ui.flush();
	assert.deepEqual(picked, ['c']);
	assert.ok(ui.rowOf('c').classList.contains('selected'));
	assert.equal(body.getAttribute('aria-current'), 'true');
});

test('styles: token-driven, touch-ready grip, reduced motion', () => {
	assert.doesNotMatch(style, /#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
	assert.ok(hasDecl(style, '.sl-grip', 'touch-action', 'none'));
	assert.ok(hasDecl(style, '.sl-grip', 'color', 'var(--text-faint)'));
	assert.ok(hasDecl(style, '.sl-row', 'border-bottom', 'var(--edge-width) solid var(--surface-edge)'));
	assert.ok(hasDecl(style, '.sl-row.selected', 'box-shadow', 'inset 2px 0 0 var(--accent)'));
	assert.ok(hasDecl(style, '.sl-row.lifted .sl-lift', 'box-shadow', 'var(--raised-shadow)'));
	assert.ok(hasDecl(style, '.sl-row.lifted .sl-lift', 'background', 'var(--bg-elevated-2)'));
	assert.ok(hasDecl(style, '.sl-lift', 'min-height', 'var(--sortable-row-h, 2.25rem)'));
	assert.ok(hasDecl(style, '.sortable-sm .sl-lift', 'min-height', 'var(--sortable-row-h, 1.875rem)'));
	assert.match(style, /@media \(pointer: coarse\)[\s\S]*width: var\(--touch-target\)/);
	assert.match(style, /\.sl-lift\s*{[^}]*transition:\s*transform var\(--dur-base\) var\(--ease\),\s*box-shadow var\(--dur-base\) var\(--ease\);/);
	assert.doesNotMatch(style, /prefers-reduced-motion/);
	assert.match(source, /animate:flip={{ duration: motion && !lifted \? 160 : 0 }}/);
	assert.match(source, /'\(prefers-reduced-motion: reduce\)'/);
	assert.match(source, /LONG_PRESS_MS = 250/);
	assert.doesNotMatch(source, /draggable=|ondragstart/);
});

test('it is exported, documented and demoed', async () => {
	assert.match(index, /default as SortableList,/);
	assert.match(index, /from '\.\/components\/molecules\/SortableList\.svelte';/);
	assert.match(readme, /### SortableList/);
	assert.match(readme, /\| `SortableList` \| `--sortable-row-h` \|/);
	assert.ok(await demoed('SortableList'));
	assert.match(page, /<SortableList[\s\S]*?numbered/);
});
