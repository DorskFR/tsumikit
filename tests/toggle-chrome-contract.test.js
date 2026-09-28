import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { rule } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [toggle, popover, icon] = await Promise.all([
	read('components/molecules/Toggle.svelte'),
	read('components/molecules/Popover.svelte'),
	read('components/atoms/Icon.svelte')
]);
const bundle = await buildFixture('mount-toggle-chrome.js');

// jsdom has no layout engine, so "same height" is asserted on the declarations
// that decide it: the chip pins a `height` instead of inheriting a line box,
// and the popover trigger resolves to the very same element and rule set.
const CHROME = [
	'height',
	'padding',
	'padding-top',
	'padding-bottom',
	'border-top-width',
	'border-radius',
	'font-size',
	'line-height',
	'box-sizing',
	'background-color',
	'color',
	'display'
];

function render(/** @type {Record<string, unknown>} */ props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const win = dom.window;
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	mount(Fixture, { target: win.document.body, props });
	flushSync();
	const el = (/** @type {string} */ id) =>
		/** @type {HTMLElement} */ (win.document.getElementById(id));
	const chrome = (/** @type {HTMLElement} */ node) => {
		const cs = win.getComputedStyle(node);
		return Object.fromEntries(CHROME.map((p) => [p, cs.getPropertyValue(p)]));
	};
	return { win, el, chrome };
}

test('a Popover trigger with the Toggle variant is a Toggle chip, same chrome and box', () => {
	const { el, chrome } = render();
	const chip = el('chip');
	const trigger = el('pop');
	assert.equal(trigger.tagName, chip.tagName);
	assert.equal(trigger.dataset.tsu, 'Popover');
	assert.ok(trigger.classList.contains('toggle'), 'the trigger wears the Toggle chip class');
	const scope = (/** @type {HTMLElement} */ n) => [...n.classList].filter((c) => c.startsWith('svelte-'));
	assert.deepEqual(scope(trigger), scope(chip));
	assert.deepEqual(chrome(trigger), chrome(chip));
});

test('the Toggle-variant trigger keeps the popover wiring and its own ARIA', () => {
	const { el } = render();
	const trigger = el('pop');
	assert.equal(trigger.getAttribute('type'), 'button');
	assert.ok(trigger.getAttribute('popovertarget'), 'the native popovertarget survives the chip chrome');
	assert.equal(trigger.getAttribute('aria-haspopup'), 'dialog');
	assert.equal(trigger.getAttribute('aria-expanded'), 'false');
	assert.equal(trigger.getAttribute('aria-label'), 'Pins');
});

test('pressed and pill reach the chip through the trigger', () => {
	const { el } = render({ pressed: true, pill: true });
	for (const id of ['chip', 'pop']) {
		const node = el(id);
		assert.ok(node.classList.contains('on'), `${id} is tinted`);
		assert.ok(node.classList.contains('pill'), `${id} is a pill`);
		assert.equal(node.getAttribute('aria-pressed'), 'true');
	}
});

test('an emoji, a 12px Icon and plain text leave the chip the same height', () => {
	const { el, chrome } = render();
	const base = chrome(el('text'));
	assert.deepEqual(chrome(el('emoji')), base);
	assert.deepEqual(chrome(el('glyph')), base);
	assert.ok(el('glyph').querySelector('svg'), 'the Icon really rendered');
});

test('the chip height is pinned to --toggle-size, not to its line box', () => {
	const base = rule(toggle, '.toggle');
	assert.equal(base.height, 'var(--toggle-size, var(--box-xs))');
	assert.equal(base['box-sizing'], 'border-box');
	assert.equal(base['line-height'], '1');
	assert.equal(base.padding, '0 var(--sp-2)');
	assert.equal(rule(toggle, '.toggle.md').height, 'var(--toggle-size, var(--control-height-compact))');
});

test('Popover renders the Toggle component rather than restating its chrome', () => {
	assert.match(popover, /import Toggle from '\.\/Toggle\.svelte';/);
	assert.match(popover, /const toggleChrome = \$derived\(variant === 'toggle' && as === 'button'\);/);
	assert.doesNotMatch(popover, /\.pop-trigger\.trigger-toggle\s*{/);
});

test('zap is registered in ICONS', () => {
	assert.match(icon, /^\t\tzap: '<path d="/m);
});
