import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { compile, preprocess } from 'svelte/compiler';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { buildFixture } from './fixtures/build.mjs';
import {
	createTypeahead,
	richSelectAction,
	typeaheadIndex,
} from '../src/lib/components/molecules/rich-select-keyboard.js';

const SRC = new URL('../src/lib/components/molecules/RichSelect.svelte', import.meta.url);
const source = await readFile(SRC, 'utf8');
const index = await readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8');
const bundle = await buildFixture('mount-rich-select.js');

test('closed: arrows step the value, Enter/Space/Alt+Down open', () => {
	const s = { open: false, count: 4, index: 1 };
	assert.deepEqual(richSelectAction({ key: 'ArrowDown' }, s), { type: 'change', index: 2 });
	assert.deepEqual(richSelectAction({ key: 'ArrowUp' }, s), { type: 'change', index: 0 });
	assert.deepEqual(richSelectAction({ key: 'ArrowDown' }, { ...s, index: 3 }), { type: 'change', index: 3 });
	assert.deepEqual(richSelectAction({ key: 'ArrowDown' }, { ...s, index: -1 }), { type: 'change', index: 0 });
	assert.deepEqual(richSelectAction({ key: 'End' }, s), { type: 'change', index: 3 });
	assert.deepEqual(richSelectAction({ key: 'Enter' }, s), { type: 'open' });
	assert.deepEqual(richSelectAction({ key: ' ' }, s), { type: 'open' });
	assert.deepEqual(richSelectAction({ key: 'ArrowDown', altKey: true }, s), { type: 'open' });
	assert.deepEqual(richSelectAction({ key: 'h' }, s), { type: 'type', char: 'h' });
	assert.equal(richSelectAction({ key: 'Tab' }, s), undefined);
	assert.equal(richSelectAction({ key: 'ArrowDown', ctrlKey: true }, s), undefined);
});

test('open: move, select, close, reorder and trailing', () => {
	const s = { open: true, count: 4, index: 1 };
	assert.deepEqual(richSelectAction({ key: 'ArrowDown' }, s), { type: 'move', index: 2 });
	assert.deepEqual(richSelectAction({ key: 'Home' }, s), { type: 'move', index: 0 });
	assert.deepEqual(richSelectAction({ key: 'End' }, s), { type: 'move', index: 3 });
	assert.deepEqual(richSelectAction({ key: 'Enter' }, s), { type: 'select' });
	assert.deepEqual(richSelectAction({ key: ' ' }, s), { type: 'select' });
	assert.deepEqual(richSelectAction({ key: 'Escape' }, s), { type: 'close' });
	assert.equal(richSelectAction({ key: 'ArrowUp', altKey: true }, s)?.type, 'select');
	assert.deepEqual(richSelectAction({ key: 'ArrowUp', altKey: true }, { ...s, reorder: true }), {
		type: 'reorder',
		from: 1,
		to: 0,
	});
	assert.equal(richSelectAction({ key: 'ArrowUp', altKey: true }, { ...s, index: 0, reorder: true }), undefined);
	assert.equal(richSelectAction({ key: 'ArrowDown', altKey: true }, { ...s, index: 3, reorder: true }), undefined);
	assert.equal(richSelectAction({ key: 'Tab' }, s), undefined);
	assert.deepEqual(richSelectAction({ key: 'Tab' }, { ...s, trailing: true }), { type: 'trailing' });
	assert.deepEqual(richSelectAction({ key: 'ArrowRight' }, { ...s, trailing: true }), { type: 'trailing' });
	assert.deepEqual(richSelectAction({ key: 'Tab', shiftKey: true }, s), { type: 'close' });
});

test('typeahead matches prefixes, folds case and accents, and cycles a repeated letter', () => {
	const labels = ['Sonnet daily', 'Opus deep work', 'Sol review', 'Élan'];
	assert.equal(typeaheadIndex(labels, 'so', -1), 0);
	assert.equal(typeaheadIndex(labels, 'sol', 0), 2);
	assert.equal(typeaheadIndex(labels, 's', 0), 2);
	assert.equal(typeaheadIndex(labels, 'ss', 2), 0);
	assert.equal(typeaheadIndex(labels, 'ela', -1), 3);
	assert.equal(typeaheadIndex(labels, 'x', 0), undefined);
	let t = 0;
	const ta = createTypeahead(500, () => t);
	assert.equal(ta.push('s'), 's');
	t = 100;
	assert.equal(ta.push('o'), 'so');
	t = 700;
	assert.equal(ta.push('o'), 'o');
});

test('RichSelect is exported and compiles for client and server without warnings', async () => {
	assert.match(index, /export \{[^}]*default as RichSelect[^}]*\} from '\.\/components\/molecules\/RichSelect\.svelte'/);
	const { code } = await preprocess(source, vitePreprocess(), { filename: 'RichSelect.svelte' });
	for (const generate of /** @type {const} */ (['client', 'server'])) {
		const out = compile(code, { generate, filename: 'RichSelect.svelte' });
		assert.equal(out.warnings.length, 0, `${generate}: ${out.warnings.map((w) => w.message).join('; ')}`);
	}
});

test('styles: focus ring, hover gated to fine pointers, transform-only press, no reduced-motion override', () => {
	assert.match(source, /rs-trigger:focus-visible\) \{\s*outline: var\(--focus-ring\);/);
	assert.match(source, /@media \(hover: hover\) and \(pointer: fine\) \{\s*\.rich-select :global\(\.pop-trigger\.rs-trigger:hover/);
	assert.match(source, /rs-trigger:active:not\(:disabled\)\) \{\s*scale: var\(--press-scale-lg\);/);
	assert.doesNotMatch(source, /prefers-reduced-motion/);
	assert.doesNotMatch(source, /transition:[^;]*\ball\b/);
	assert.match(source, /\.rs-grip \{[^}]*width: 24px;[^}]*min-height: 24px;/);
});

function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
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
		if (this.hasAttribute('data-open')) return;
		this.setAttribute('data-open', '');
		toggle(this, 'open');
	};
	proto.hidePopover = function () {
		if (!this.hasAttribute('data-open')) return;
		this.removeAttribute('data-open');
		toggle(this, 'closed');
	};
	win.eval(bundle);
	const { mount, unmount, flushSync, Fixture } = win.__fixture;
	const app = mount(Fixture, { target: win.document.body, props });
	flushSync();
	const doc = /** @type {Document} */ (win.document);
	const trigger = /** @type {HTMLElement} */ (doc.querySelector('.rs-trigger'));
	const panel = /** @type {HTMLElement} */ (doc.querySelector('.rs-panel'));
	const out = (/** @type {string} */ id) => doc.getElementById(id)?.textContent ?? '';
	const isOpen = () => panel.hasAttribute('data-open');
	const settle = async () => {
		await new Promise((r) => setTimeout(r, 0));
		flushSync();
	};
	/** @param {Element} el @param {string} k @param {Record<string, unknown>} [init] */
	const key = (el, k, init = {}) => {
		const e = new win.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
		el.dispatchEvent(e);
		flushSync();
		return e;
	};
	const options = () => [...doc.querySelectorAll('[role="option"]')];
	const activeOption = () => doc.getElementById(trigger.getAttribute('aria-activedescendant') ?? '');
	return { win, doc, trigger, panel, out, isOpen, settle, key, options, activeOption, unmount: () => unmount(app) };
}

test('trigger wiring: combobox role, listbox inside a group panel, selected card in the trigger', async () => {
	const { trigger, panel, doc, settle, key, options, unmount } = render();
	assert.equal(trigger.getAttribute('role'), 'combobox');
	assert.equal(trigger.getAttribute('aria-haspopup'), 'listbox');
	assert.equal(trigger.getAttribute('aria-expanded'), 'false');
	assert.equal(trigger.getAttribute('aria-label'), 'Spawn profile');
	assert.equal(panel.getAttribute('role'), 'group');
	assert.equal(trigger.querySelector('.card')?.textContent, 'Sonnet daily · sonnet');
	assert.equal(trigger.querySelector('.card')?.getAttribute('data-in-trigger'), 'true');
	key(trigger, 'Enter');
	await settle();
	const list = doc.getElementById(trigger.getAttribute('aria-controls') ?? '');
	assert.equal(list?.getAttribute('role'), 'listbox');
	assert.equal(options().length, 4);
	assert.deepEqual(
		options().map((o) => o.getAttribute('aria-selected')),
		['false', 'true', 'false', 'false']
	);
	for (const gear of doc.querySelectorAll('.gear')) assert.equal(gear.closest('[role="option"]'), null);
	unmount();
});

test('keyboard selection while closed changes the value without opening', () => {
	const { trigger, out, isOpen, key, unmount } = render();
	const e = key(trigger, 'ArrowDown');
	assert.equal(e.defaultPrevented, true);
	assert.equal(isOpen(), false);
	assert.equal(out('value'), 'haiku');
	assert.equal(out('changes'), '1');
	key(trigger, 'ArrowUp');
	key(trigger, 'ArrowUp');
	assert.equal(out('value'), 'opus');
	key(trigger, 'ArrowUp');
	assert.equal(out('value'), 'opus', 'clamps at the first option');
	assert.equal(out('changes'), '3');
	assert.equal(trigger.querySelector('.card')?.textContent, 'Opus deep work · opus');
	unmount();
});

test('typeahead selects while closed and moves the active option while open', async () => {
	const { trigger, out, key, settle, activeOption, unmount } = render();
	key(trigger, 's');
	assert.equal(out('value'), 'sol', 'from Sonnet, a repeated s goes to the next S');
	key(trigger, 'Enter');
	await settle();
	key(trigger, 'h');
	assert.equal(activeOption()?.textContent?.trim(), 'Haiku quick · haiku');
	assert.equal(out('value'), 'sol', 'open typeahead only moves the highlight');
	key(trigger, 'Enter');
	await settle();
	assert.equal(out('value'), 'haiku');
	unmount();
});

test('open list: arrows, Home/End move the highlight; Enter selects and closes', async () => {
	const { trigger, out, isOpen, key, settle, activeOption, unmount } = render();
	key(trigger, ' ');
	await settle();
	assert.equal(isOpen(), true);
	assert.equal(trigger.getAttribute('aria-expanded'), 'true');
	assert.equal(activeOption()?.getAttribute('aria-selected'), 'true', 'opens on the selected option');
	key(trigger, 'End');
	assert.equal(activeOption()?.textContent?.trim(), 'Sol review · sol');
	key(trigger, 'Home');
	key(trigger, 'ArrowDown');
	assert.equal(activeOption()?.textContent?.trim(), 'Sonnet daily · sonnet');
	key(trigger, 'ArrowDown');
	key(trigger, 'Enter');
	await settle();
	assert.equal(isOpen(), false);
	assert.equal(out('value'), 'haiku');
	unmount();
});

test('a click on an option selects it and closes', async () => {
	const { trigger, out, isOpen, key, settle, options, unmount } = render();
	key(trigger, 'Enter');
	await settle();
	/** @type {HTMLElement} */ (options()[0]).click();
	await settle();
	assert.equal(out('value'), 'opus');
	assert.equal(isOpen(), false);
	unmount();
});

test('a trailing action never selects and keeps the list open; Tab/ArrowRight reach it, ArrowLeft returns', async () => {
	const { doc, trigger, out, isOpen, key, settle, unmount } = render();
	key(trigger, 'Enter');
	await settle();
	const gears = /** @type {HTMLElement[]} */ ([...doc.querySelectorAll('.gear')]);
	gears[0].click();
	await settle();
	assert.equal(out('gear'), 'opus');
	assert.equal(out('value'), 'sonnet');
	assert.equal(isOpen(), true);
	trigger.focus();
	const tab = key(trigger, 'Tab');
	assert.equal(tab.defaultPrevented, true);
	assert.equal(doc.activeElement, gears[1], 'Tab lands on the active (selected) row action');
	key(gears[1], 'Enter');
	assert.equal(out('value'), 'sonnet', 'Enter on the action does not select');
	key(gears[1], 'ArrowLeft');
	assert.equal(doc.activeElement, trigger);
	key(trigger, 'ArrowRight');
	assert.equal(doc.activeElement, gears[1]);
	assert.equal(isOpen(), true);
	unmount();
});

test('Escape closes and returns focus to the trigger, from the trigger and from a trailing action', async () => {
	const { doc, trigger, isOpen, key, settle, unmount } = render();
	trigger.focus();
	key(trigger, 'Enter');
	await settle();
	key(trigger, 'Escape');
	await settle();
	assert.equal(isOpen(), false);
	assert.equal(doc.activeElement, trigger);
	key(trigger, 'Enter');
	await settle();
	key(trigger, 'Tab');
	const gear = /** @type {HTMLElement} */ (doc.activeElement);
	assert.equal(gear.classList.contains('gear'), true);
	key(gear, 'Escape');
	await settle();
	assert.equal(isOpen(), false);
	assert.equal(doc.activeElement, trigger);
	unmount();
});

test('Alt+ArrowUp/Down reorder the active option and announce the move', async () => {
	const { doc, trigger, out, key, settle, activeOption, unmount } = render();
	key(trigger, 'Enter');
	await settle();
	key(trigger, 'ArrowUp', { altKey: true });
	await settle();
	assert.equal(out('moves'), '1>0');
	assert.equal(out('order'), 'sonnet,opus,haiku,sol');
	assert.equal(activeOption()?.textContent?.trim(), 'Sonnet daily · sonnet', 'the highlight follows the moved option');
	key(trigger, 'ArrowDown', { altKey: true });
	key(trigger, 'ArrowDown', { altKey: true });
	await settle();
	assert.equal(out('order'), 'opus,haiku,sonnet,sol');
	assert.equal(out('value'), 'sonnet', 'reordering keeps the selection');
	assert.match(doc.querySelector('[aria-live]')?.textContent ?? '', /Sonnet daily moved to position 3 of 4/);
	assert.equal(doc.querySelectorAll('.rs-grip').length, 4);
	unmount();
});

test('without onreorder there are no grips and Alt+arrows do not reorder', async () => {
	const { doc, trigger, out, key, settle, unmount } = render({ reorderable: false });
	key(trigger, 'Enter');
	await settle();
	assert.equal(doc.querySelectorAll('.rs-grip').length, 0);
	key(trigger, 'ArrowDown', { altKey: true });
	assert.equal(out('order'), 'opus,sonnet,haiku,sol');
	unmount();
});

test('the footer renders under the list inside the panel and can close it', async () => {
	const { doc, panel, trigger, isOpen, key, settle, unmount } = render();
	key(trigger, 'Enter');
	await settle();
	const footer = /** @type {HTMLElement} */ (doc.getElementById('new'));
	assert.equal(panel.contains(footer), true);
	assert.equal(footer.closest('[role="listbox"]'), null);
	footer.click();
	await settle();
	assert.equal(isOpen(), false);
	unmount();
});

test('sound: open/close come from Popover, selection plays click/tick, all gated by the sound prop', () => {
	assert.match(source, /sound = true,/);
	assert.match(source, /<Popover[^>]*\{sound\}/);
	assert.match(source, /playSound\(closeAfter \? 'click' : 'tick', sound\)/);
	assert.doesNotMatch(source, /sound-synth/);
});
