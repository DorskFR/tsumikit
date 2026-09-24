import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import {
	applyTrigger,
	comboboxAction,
	findTrigger,
	nextComboboxIndex,
} from '../src/lib/components/molecules/combobox-keyboard.js';
import { buildFixture } from './fixtures/build.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(p, import.meta.url), 'utf8');
const [source, floating, index, readme, page] = await Promise.all([
	read('../src/lib/components/molecules/Combobox.svelte'),
	read('../src/lib/floating.ts'),
	read('../src/lib/index.ts'),
	read('../README.md'),
	read('../src/routes/+page.svelte'),
]);
const bundle = await buildFixture('mount-combobox.js');

test('arrows step and wrap, Home/End only when opted in', () => {
	assert.equal(nextComboboxIndex(0, 3, 'ArrowDown'), 1);
	assert.equal(nextComboboxIndex(2, 3, 'ArrowDown'), 0);
	assert.equal(nextComboboxIndex(2, 3, 'ArrowDown', { loop: false }), 2);
	assert.equal(nextComboboxIndex(0, 3, 'ArrowUp'), 2);
	assert.equal(nextComboboxIndex(0, 3, 'ArrowUp', { loop: false }), 0);
	assert.equal(nextComboboxIndex(1, 3, 'Home'), undefined);
	assert.equal(nextComboboxIndex(1, 3, 'End'), undefined);
	assert.equal(nextComboboxIndex(1, 3, 'Home', { homeEnd: true }), 0);
	assert.equal(nextComboboxIndex(1, 3, 'End', { homeEnd: true }), 2);
	assert.equal(nextComboboxIndex(9, 3, 'ArrowDown'), 0);
	assert.equal(nextComboboxIndex(0, 0, 'ArrowDown'), undefined);
	assert.equal(nextComboboxIndex(0, 3, 'a'), undefined);
});

test('keydown actions: closed consumes nothing, Escape closes, Enter/Tab select without modifiers', () => {
	const base = { open: true, count: 3, index: 1 };
	assert.equal(comboboxAction({ key: 'ArrowDown' }, { ...base, open: false }), undefined);
	assert.deepEqual(comboboxAction({ key: 'Escape' }, base), { type: 'close' });
	assert.deepEqual(comboboxAction({ key: 'Escape' }, { ...base, count: 0 }), { type: 'close' });
	assert.deepEqual(comboboxAction({ key: 'Enter' }, base), { type: 'select' });
	assert.deepEqual(comboboxAction({ key: 'Tab' }, base), { type: 'select' });
	assert.equal(comboboxAction({ key: 'Enter' }, { ...base, count: 0 }), undefined);
	assert.equal(comboboxAction({ key: 'Enter', shiftKey: true }, base), undefined);
	assert.equal(comboboxAction({ key: 'Tab', shiftKey: true }, base), undefined);
	assert.equal(comboboxAction({ key: 'Enter', metaKey: true }, base), undefined);
	assert.equal(comboboxAction({ key: 'Tab' }, { ...base, selectOn: ['Enter'] }), undefined);
	assert.deepEqual(comboboxAction({ key: 'ArrowDown' }, base), { type: 'move', index: 2 });
	assert.deepEqual(comboboxAction({ key: 'ArrowUp' }, base), { type: 'move', index: 0 });
	assert.equal(comboboxAction({ key: 'Home' }, base), undefined);
	assert.deepEqual(comboboxAction({ key: 'End' }, { ...base, homeEnd: true }), { type: 'move', index: 2 });
	assert.equal(comboboxAction({ key: 'x' }, base), undefined);
});

test('findTrigger finds the token under the caret and rejects mid-word or spaced ones', () => {
	assert.deepEqual(findTrigger('hi @ali', 7), { start: 3, char: '@', query: 'ali' });
	assert.deepEqual(findTrigger('@', 1), { start: 0, char: '@', query: '' });
	assert.deepEqual(findTrigger('see #abc now', 8, '#'), { start: 4, char: '#', query: 'abc' }, 'caret inside');
	assert.equal(findTrigger('see #abc now', 8), null, 'only the configured trigger chars count');
	assert.equal(findTrigger('mail me@host', 12), null);
	assert.equal(findTrigger('@a b', 4), null);
	assert.equal(findTrigger('##x', 3), null);
	assert.equal(findTrigger('plain', 5), null);
	assert.deepEqual(findTrigger('go #1 or @two', 13, '#@'), { start: 9, char: '@', query: 'two' });
	assert.deepEqual(findTrigger('(#tag', 5, ['#']), { start: 1, char: '#', query: 'tag' });
	assert.equal(findTrigger('x #tag', 1, '#'), null);
});

test('applyTrigger replaces the token and lands the caret after the suffix', () => {
	const t = findTrigger('hi @ali there', 7, '@');
	assert.ok(t);
	assert.deepEqual(applyTrigger('hi @ali there', 7, t, '@alice'), { text: 'hi @alice  there', caret: 10 });
	assert.deepEqual(applyTrigger('hi @ali', 7, t, '@alice', ''), { text: 'hi @alice', caret: 9 });
});

test('Combobox source contract: anchor, top-layer listbox, active-descendant wiring', () => {
	assert.match(source, /data-tsu="Combobox"/);
	assert.match(source, /\.\.\.rest\s*\}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = \$props\(\);/);
	assert.match(source, /open = \$bindable\(false\)/);
	assert.match(source, /index = \$bindable\(0\)/);
	assert.match(source, /anchor = 'field'/);
	assert.match(source, /selectOn = \['Enter', 'Tab'\]/);
	assert.match(source, /homeEnd = false/);
	assert.match(source, /popover="manual"\s+role="listbox"\s+aria-label={label}/);
	assert.match(source, /role="option"\s+tabindex={-1}\s+aria-selected={i === active}/);
	assert.match(source, /'aria-activedescendant'/);
	assert.match(source, /onkeydowncapture={onKeydown}/);
	assert.match(source, /caretRect\(f\) : f\.getBoundingClientRect\(\)/);
	assert.match(source, /placeAt\(r, panelEl, placement, gap\)/);
	assert.match(source, /panelClass\?: string/);
	assert.match(floating, /export function placeAt\(/);
	assert.match(floating, /placeAt\(trigger\.getBoundingClientRect\(\), floating, placement, gap\)/);
});

test('Combobox is exported, documented and demoed', () => {
	assert.match(index, /export \{ default as Combobox \} from '\.\/components\/molecules\/Combobox\.svelte';/);
	assert.match(index, /findTrigger,\n\tnextComboboxIndex,\n\} from '\.\/components\/molecules\/combobox-keyboard\.js';/);
	assert.match(readme, /Combobox \(suggestion listbox/);
	assert.match(readme, /\| `Combobox` \| `--cb-bg`/);
	assert.match(page, /<section class="section" id="combobox">/);
	assert.match(page, /id: 'combobox', label: 'Combobox'/);
	assert.match(page, /<Combobox[\s\S]*anchor="caret"/);
});

/**
 * @param {{
 *   kind?: 'input' | 'textarea',
 *   options?: string[],
 *   open?: boolean,
 *   homeEnd?: boolean,
 *   empty?: string,
 *   fieldRole?: 'auto' | 'combobox' | 'none',
 *   onselect?: (option: string, index: number) => void,
 *   onclose?: (reason: string) => void,
 * }} [props]
 */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
	});
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	mount(Fixture, { target: dom.window.document.body, props });
	flushSync();
	const doc = dom.window.document;
	const field = /** @type {HTMLInputElement | HTMLTextAreaElement} */ (doc.querySelector('input, textarea'));
	/** @param {string} key @param {KeyboardEventInit} [init] */
	const key = (key, init = {}) => {
		const e = new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
		field.dispatchEvent(e);
		flushSync();
		return e;
	};
	return {
		doc,
		win: dom.window,
		field,
		flush: flushSync,
		key,
		ctl: dom.window.__cbctl,
		listbox: () => doc.querySelector('[role="listbox"]'),
		options: () => [...doc.querySelectorAll('[role="option"]')],
		activeId: () => field.getAttribute('aria-activedescendant'),
		active: () => doc.querySelector('[role="option"][aria-selected="true"]')?.textContent?.trim(),
	};
}

test('the wrapped input gets the combobox ARIA and points at the highlighted option', () => {
	const ui = render();
	assert.equal(ui.field.getAttribute('role'), 'combobox');
	assert.equal(ui.field.getAttribute('aria-autocomplete'), 'list');
	assert.equal(ui.field.getAttribute('aria-haspopup'), 'listbox');
	assert.equal(ui.field.getAttribute('aria-expanded'), 'true');
	const list = ui.listbox();
	assert.ok(list);
	assert.equal(list.getAttribute('aria-label'), 'Suggestions');
	assert.equal(ui.field.getAttribute('aria-controls'), list.id);
	assert.equal(ui.options().length, 3);
	assert.equal(ui.activeId(), ui.options()[0].id);
	assert.equal(ui.active(), 'apple');
	assert.equal(ui.options()[1].getAttribute('aria-selected'), 'false');
	assert.equal(ui.options()[0].getAttribute('tabindex'), '-1');
	assert.equal(ui.doc.querySelector('[data-tsu="Combobox"]')?.contains(list), true);
});

test('arrows move the highlight through aria-activedescendant, wrapping at both ends', () => {
	const ui = render();
	assert.equal(ui.key('ArrowDown').defaultPrevented, true);
	assert.equal(ui.active(), 'apricot');
	assert.equal(ui.activeId(), ui.options()[1].id);
	ui.key('ArrowDown');
	ui.key('ArrowDown');
	assert.equal(ui.active(), 'apple');
	ui.key('ArrowUp');
	assert.equal(ui.active(), 'banana');
	const { open, index: bound } = ui.ctl.state();
	assert.equal(open, true);
	assert.equal(bound, 2, 'bind:index reflects the highlight');
});

test('Home/End keep moving the caret unless homeEnd is set', () => {
	const ui = render();
	ui.key('ArrowDown');
	assert.equal(ui.key('Home').defaultPrevented, false);
	assert.equal(ui.active(), 'apricot');
	const opted = render({ homeEnd: true });
	assert.equal(opted.key('End').defaultPrevented, true);
	assert.equal(opted.active(), 'banana');
	opted.key('Home');
	assert.equal(opted.active(), 'apple');
});

test('Enter and Tab pick the highlighted option, close, and never reach the field', () => {
	/** @type {unknown[]} */
	const picks = [];
	/** @type {string[]} */
	const closes = [];
	const ui = render({ onselect: (o, i) => picks.push([o, i]), onclose: (r) => closes.push(r) });
	let leaked = 0;
	ui.field.addEventListener('keydown', () => leaked++);
	ui.key('ArrowDown');
	const enter = ui.key('Enter');
	assert.equal(enter.defaultPrevented, true);
	assert.equal(leaked, 0);
	assert.deepEqual(picks, [['apricot', 1]]);
	assert.deepEqual(closes, ['select']);
	assert.equal(ui.listbox(), null);
	assert.equal(ui.field.getAttribute('aria-expanded'), 'false');
	assert.equal(ui.activeId(), null);
	assert.equal(ui.field.hasAttribute('aria-controls'), false);
	assert.equal(ui.key('ArrowDown').defaultPrevented, false, 'closed: keys pass through');
	assert.equal(leaked, 1);

	ui.ctl.setOpen(true);
	ui.flush();
	assert.ok(ui.listbox());
	assert.equal(ui.key('Tab', { shiftKey: true }).defaultPrevented, false);
	assert.ok(ui.listbox(), 'Shift+Tab is left to focus navigation');
	assert.equal(ui.key('Tab').defaultPrevented, true);
	assert.deepEqual(picks, [
		['apricot', 1],
		['apricot', 1],
	]);
	assert.equal(ui.listbox(), null);
});

test('Escape and blur close with their reason; focus moving into the listbox does not', () => {
	/** @type {string[]} */
	const closes = [];
	const ui = render({ onclose: (r) => closes.push(r) });
	assert.equal(ui.key('Escape').defaultPrevented, true);
	assert.deepEqual(closes, ['escape']);
	assert.equal(ui.listbox(), null);

	ui.ctl.setOpen(true);
	ui.flush();
	ui.field.focus();
	ui.field.dispatchEvent(
		new ui.win.FocusEvent('focusout', { bubbles: true, relatedTarget: ui.options()[0] })
	);
	ui.flush();
	assert.ok(ui.listbox(), 'stays open while focus lands on an option');
	ui.field.dispatchEvent(
		new ui.win.FocusEvent('focusout', { bubbles: true, relatedTarget: ui.doc.getElementById('after') })
	);
	ui.flush();
	assert.deepEqual(closes, ['escape', 'blur']);
	assert.equal(ui.listbox(), null);
});

test('clicking an option picks it, hovering highlights it', () => {
	/** @type {unknown[]} */
	const picks = [];
	const ui = render({ onselect: (o, i) => picks.push([o, i]) });
	const row = ui.options()[2];
	row.dispatchEvent(new ui.win.PointerEvent('pointerenter', { bubbles: false }));
	ui.flush();
	assert.equal(ui.active(), 'banana');
	const down = new ui.win.PointerEvent('pointerdown', { bubbles: true, cancelable: true });
	row.dispatchEvent(down);
	assert.equal(down.defaultPrevented, true, 'the field keeps focus');
	row.dispatchEvent(new ui.win.MouseEvent('click', { bubbles: true }));
	ui.flush();
	assert.deepEqual(picks, [['banana', 2]]);
	assert.equal(ui.listbox(), null);
});

test('a textarea keeps its native role by default; fieldRole overrides both ways', () => {
	const ta = render({ kind: 'textarea' });
	assert.equal(ta.field.tagName, 'TEXTAREA');
	assert.equal(ta.field.hasAttribute('role'), false);
	assert.equal(ta.field.getAttribute('aria-expanded'), 'true');
	assert.equal(ta.activeId(), ta.options()[0].id);
	assert.equal(render({ kind: 'textarea', fieldRole: 'combobox' }).field.getAttribute('role'), 'combobox');
	assert.equal(render({ fieldRole: 'none' }).field.hasAttribute('role'), false);
});

test('no options: the listbox hides unless an empty message is given, and nothing is active', () => {
	const hidden = render({ options: [] });
	assert.equal(hidden.listbox(), null);
	assert.equal(hidden.field.getAttribute('aria-expanded'), 'false');
	assert.equal(hidden.key('Enter').defaultPrevented, false);

	const shown = render({ options: [], empty: 'No matches' });
	assert.ok(shown.listbox());
	assert.equal(shown.doc.querySelector('.cb-empty')?.textContent?.trim(), 'No matches');
	assert.equal(shown.activeId(), null);
	assert.equal(shown.key('Enter').defaultPrevented, false, 'nothing to pick');
	assert.equal(shown.key('Escape').defaultPrevented, true);
	assert.equal(shown.listbox(), null);

	shown.ctl.setOptions(['x']);
	shown.ctl.setOpen(true);
	shown.flush();
	assert.equal(shown.active(), 'x');
});
