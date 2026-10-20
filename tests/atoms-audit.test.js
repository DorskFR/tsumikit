import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';

const badge = await readFile(new URL('../src/lib/components/atoms/Badge.svelte', import.meta.url), 'utf8');
const bundle = await buildFixture('mount-atoms-audit.svelte.js');

/** @param {Record<string, unknown>} init */
function render(init = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const w = dom.window;
	w.eval(bundle);
	const { mount, flushSync, Fixture, props } = w.__fixture;
	/** @type {string[]} */
	const log = [];
	const p = props({ ...init, onlog: (/** @type {string} */ m) => log.push(m) });
	mount(Fixture, { target: w.document.body, props: p });
	flushSync();
	const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (w.document.getElementById(id));
	/** @param {Record<string, unknown>} next */
	const set = (next) => {
		Object.assign(p, next);
		flushSync();
	};
	/** @param {Element} target */
	const escape = (target) => {
		const ev = new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		target.dispatchEvent(ev);
		return ev;
	};
	return { w, log, $, set, escape };
}

test('an inactive link Button drops href, stays a named disabled link and ignores clicks', () => {
	for (const state of [{ disabled: true }, { loading: true }]) {
		const ui = render(state);
		const a = ui.$('link');
		assert.equal(a.tagName, 'A');
		assert.equal(a.hasAttribute('href'), false);
		assert.equal(a.getAttribute('role'), 'link');
		assert.equal(a.getAttribute('aria-disabled'), 'true');
		const ev = new ui.w.MouseEvent('click', { bubbles: true, cancelable: true });
		a.dispatchEvent(ev);
		assert.equal(ev.defaultPrevented, true);
		assert.deepEqual(ui.log, []);
	}
});

test('an active link Button keeps href and fires onclick; re-enabling restores it', () => {
	const ui = render({ disabled: true });
	ui.set({ disabled: false });
	const a = ui.$('link');
	assert.equal(a.getAttribute('href'), '/checkout');
	assert.equal(a.hasAttribute('role'), false);
	assert.equal(a.hasAttribute('aria-disabled'), false);
	a.dispatchEvent(new ui.w.MouseEvent('click', { bubbles: true, cancelable: true }));
	assert.deepEqual(ui.log, ['link']);
});

test('collapseLabel aria-label follows later label changes', async () => {
	const ui = render();
	assert.equal(ui.$('collapse').getAttribute('aria-label'), 'Save');
	ui.set({ saving: true });
	await new Promise((r) => setTimeout(r));
	assert.equal(ui.$('collapse').getAttribute('aria-label'), 'Saving…');
});

test('Card and Badge as="button" default to type="button" and never submit their form', () => {
	const ui = render();
	assert.equal(ui.$('card').getAttribute('type'), 'button');
	assert.equal(ui.$('card-submit').getAttribute('type'), 'submit');
	assert.equal(ui.$('card-div').hasAttribute('type'), false);
	assert.equal(ui.$('badge').getAttribute('type'), 'button');
	assert.equal(ui.$('badge-span').hasAttribute('type'), false);
	ui.$('card').click();
	ui.$('badge').click();
	assert.deepEqual(ui.log, ['card', 'badge']);
});

test('Badge action grows a coarse-pointer touch slab that never overflows inline-end', () => {
	assert.match(badge, /@media \(pointer: coarse\)\s*{\s*\.action\s*{\s*position: relative;/);
	assert.ok(hasDecl(badge, '.action::before', 'inset-block', 'var(--touch-slab)'));
	assert.ok(hasDecl(badge, '.action::before', 'inset-inline-start', 'var(--touch-slab)'));
	assert.ok(hasDecl(badge, '.action::before', 'inset-inline-end', '0'));
});

test('only the topmost Scrim closes on Escape', () => {
	const ui = render({ under: true });
	ui.set({ over: true });
	assert.equal(ui.escape(ui.$('outside')).defaultPrevented, true);
	assert.deepEqual(ui.log, ['over']);
	ui.set({ over: false });
	ui.escape(ui.$('outside'));
	assert.deepEqual(ui.log, ['over', 'under']);
});

test('a Scrim leaves an Escape aimed at an open dialog alone', () => {
	const ui = render({ under: true, modal: true });
	const ev = ui.escape(ui.$('modal-input'));
	assert.equal(ev.defaultPrevented, false);
	assert.deepEqual(ui.log, []);
});

test('a Scrim inside its own popover still closes on Escape from within it', () => {
	const ui = render({ under: true, inPopover: true });
	assert.equal(ui.escape(ui.$('pop-input')).defaultPrevented, true);
	assert.deepEqual(ui.log, ['pop']);
});
