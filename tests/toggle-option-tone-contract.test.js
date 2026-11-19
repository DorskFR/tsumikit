import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { rule } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/${p}`, import.meta.url), 'utf8');
const [toggle, option, toggleDemo, optionDemo] = await Promise.all([
	read('lib/components/molecules/Toggle.svelte'),
	read('lib/components/molecules/OptionButton.svelte'),
	read('demo/molecules/Toggle/02-Variants.svelte'),
	read('demo/molecules/OptionButton/02-Variants.svelte')
]);
const bundle = await buildFixture('mount-toggle-option-tone.js');

const TONES = /** @type {const} */ ([
	['neutral', 'var(--text)'],
	['ok', 'var(--ok)'],
	['warn', 'var(--warn)'],
	['danger', 'var(--danger)'],
	['info', 'var(--info)']
]);

/**
 * @param {'Toggle' | 'OptionButton'} name
 * @param {Record<string, unknown>} props
 */
function classes(name, props) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
	dom.window.eval(bundle);
	const { mount, flushSync, [name]: Component } = dom.window.__fixture;
	mount(Component, { target: dom.window.document.body, props });
	flushSync();
	const el = /** @type {HTMLElement} */ (dom.window.document.querySelector(`[data-tsu="${name}"]`));
	return [...el.classList].filter((c) => c.startsWith('tone-'));
}

test('Toggle and OptionButton type tone with the shared union and default to accent', () => {
	for (const src of [toggle, option]) {
		assert.match(src, /import { canonicalTone, type Tone } from '\$lib\/tone'/);
		assert.match(src, /tone\?: Tone;/);
		assert.match(src, /tone = 'accent',/);
	}
});

test('the default tone adds no class; each other tone adds its own, success folding into ok', () => {
	for (const [name, on] of /** @type {const} */ ([['Toggle', 'pressed'], ['OptionButton', 'selected']])) {
		assert.deepEqual(classes(name, { [on]: true }), [], name);
		assert.deepEqual(classes(name, { [on]: true, tone: 'accent' }), [], name);
		for (const [t] of TONES) assert.deepEqual(classes(name, { [on]: true, tone: t }), [`tone-${t}`], `${name} ${t}`);
		assert.deepEqual(classes(name, { [on]: true, tone: 'success' }), ['tone-ok'], name);
	}
});

test('a pressed Toggle paints text, edge and tint straight from the tone token', () => {
	const paint = (/** @type {string} */ v) => ({
		color: v,
		'border-color': `color-mix(in srgb, ${v} 55%, transparent)`,
		background: `color-mix(in srgb, ${v} 16%, transparent)`
	});
	assert.deepEqual(rule(toggle, '.toggle.on'), paint('var(--accent)'));
	for (const [t, v] of TONES) assert.deepEqual(rule(toggle, `.toggle.on.tone-${t}`), paint(v), t);
});

test('a selected OptionButton paints ring, tint, text and hint text straight from the tone token', () => {
	const paint = (/** @type {string} */ v) => ({
		'border-color': v,
		background: `color-mix(in srgb, ${v} 14%, var(--bg))`,
		color: v
	});
	const hint = (/** @type {string} */ c) => `.opt.selected${c} .description,\n\t.opt.selected${c} :global(.faint)`;
	assert.deepEqual(rule(option, '.opt.selected'), paint('var(--accent)'));
	assert.equal(rule(option, hint('')).color, 'color-mix(in srgb, var(--accent) 70%, var(--text-muted))');
	for (const [t, v] of TONES) {
		assert.deepEqual(rule(option, `.opt.selected.tone-${t}`), paint(v), t);
		assert.equal(rule(option, hint(`.tone-${t}`)).color, `color-mix(in srgb, ${v} 70%, var(--text-muted))`, t);
		assert.equal(rule(option, `.opt.selected.tone-${t}:hover:not(:disabled)`).background, `color-mix(in srgb, ${v} 20%, var(--bg))`, t);
	}
});

test('neither component declares a custom property or reads a style hook', () => {
	for (const src of [toggle, option]) {
		assert.doesNotMatch(src, /--[a-z][a-z0-9-]*\s*:|var\(--[a-z0-9-]+,/);
		assert.doesNotMatch(src, /--toggle-|--opt-|--icon-size|--faint-color/);
	}
});

test('the Variants examples show tone', () => {
	assert.match(toggleDemo, /<Toggle[^>]*{tone}/);
	assert.match(optionDemo, /<OptionButton[^>]*\btone=/s);
});
