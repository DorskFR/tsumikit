import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';

const button = await readFile(new URL('../src/lib/components/atoms/Button.svelte', import.meta.url), 'utf8');
const bundle = await buildFixture('mount-stacked-button.js');

function render() {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	mount(Fixture, { target: dom.window.document.body });
	flushSync();
	return (/** @type {string} */ id) => /** @type {HTMLElement} */ (dom.window.document.getElementById(id));
}

test('stacked layout puts an aria-hidden glyph over the label', () => {
	const el = render();
	const slot = el('slot');
	assert.ok(slot.classList.contains('btn-stacked'));
	assert.ok(slot.classList.contains('btn-sm'));
	assert.ok(slot.classList.contains('btn-danger'));
	const [glyph, label] = slot.querySelectorAll('.btn-glyph, .btn-stack-label');
	assert.ok(glyph.classList.contains('btn-glyph'));
	assert.equal(glyph.getAttribute('aria-hidden'), 'true');
	assert.equal(glyph.textContent?.trim(), '■');
	assert.equal(label.textContent?.trim(), 'Disarm');
	assert.ok(el('icon').querySelector('.btn-glyph svg'), 'a registry name renders the Icon');
	assert.equal(el('snippet').querySelector('.btn-glyph b')?.textContent, '☰');
});

test('shortcut paints a corner hint and sets aria-keyshortcuts', () => {
	const el = render();
	const slot = el('slot');
	assert.equal(slot.getAttribute('aria-keyshortcuts'), '1');
	const hint = slot.querySelector('.btn-shortcut');
	assert.equal(hint?.textContent, '1');
	assert.equal(hint?.getAttribute('aria-hidden'), 'true');
	assert.ok(slot.classList.contains('btn-hinted'));
	assert.equal(el('snippet').getAttribute('aria-keyshortcuts'), 'Shift+G', 'an explicit attribute wins');
	assert.equal(el('plain').getAttribute('aria-keyshortcuts'), null);
	assert.equal(el('plain').querySelector('.btn-shortcut'), null);
});

test('shortcut and count coexist in opposite corners', () => {
	const icon = render()('icon');
	assert.equal(icon.querySelector('.btn-shortcut')?.textContent, '2');
	assert.equal(icon.querySelector('.btn-count')?.textContent, '3');
	assert.ok(hasDecl(button, '.btn-shortcut', 'left', 'var(--sp-1)'));
	assert.ok(hasDecl(button, '.btn-shortcut', 'top', 'var(--sp-0-5)'));
	assert.ok(hasDecl(button, '.btn-count', 'right', '0'));
});

test('pressed sets aria-pressed and keeps the accent ring on stacked slots', () => {
	const el = render();
	assert.equal(el('snippet').getAttribute('aria-pressed'), 'true');
	assert.equal(el('plain').getAttribute('aria-pressed'), null);
	assert.ok(hasDecl(button, ".btn-stacked[aria-pressed='true']", 'box-shadow', 'inset 0 0 0 1px var(--btn-on, var(--accent))'));
});

test('inline layout is unchanged', () => {
	const inline = render()('inline');
	assert.equal(inline.classList.contains('btn-stacked'), false);
	assert.equal(inline.querySelector('.btn-glyph, .btn-stack-label, .btn-shortcut'), null);
	assert.equal(inline.innerHTML.replace(/<!---->/g, '').trim(), 'Save');
});

test('stacked heights follow size from tokens; danger paints border and ink', () => {
	assert.ok(hasDecl(button, '.btn-stacked.btn-sm', 'min-height', 'var(--btn-size, var(--control-height-default))'));
	assert.ok(
		hasDecl(button, '.btn-stacked.btn-lg', 'min-height', 'var(--btn-size, calc(var(--control-height-large) + var(--sp-2) + var(--sp-0-5)))')
	);
	assert.match(button, /\.btn-stacked,\s*\.btn-stacked\.btn-sm,[^{]*{[^}]*min-height: var\(--btn-size, var\(--control-height-large\)\);/s);
	assert.match(button, /\.btn-stacked\.btn-danger,\s*\.btn-stacked\.btn-tone-danger\s*{\s*color: var\(--danger\);\s*border-color: var\(--danger\);/);
	assert.ok(hasDecl(button, '.btn-shortcut', 'color', 'var(--text-faint)'));
	assert.ok(hasDecl(button, '.btn-shortcut', 'font-family', 'var(--font-mono)'));
});

test('stacked slots carry the coarse-pointer hit slab', () => {
	assert.match(button, /\.btn-stacked:not\(\.hit-compact\)::after\s*{[^}]*--touch-target/s);
});
