import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { rule } from './helpers.mjs';

const component = await readFile(new URL('../src/lib/components/molecules/SectionHeader.svelte', import.meta.url), 'utf8');
const bundle = await buildFixture('mount-section-header.js');

/** @param {Record<string, unknown>} init */
function render(init = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const win = /** @type {any} */ (dom.window);
	win.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
	win.eval(bundle);
	const f = win.__fixture;
	const children = f.createRawSnippet(() => ({ render: () => '<p class="probe">needle</p>' }));
	f.mount(f.SectionHeader, { target: win.document.body, props: { title: 'Section', children, ...init } });
	f.flushSync();
	const doc = /** @type {Document} */ (win.document);
	return {
		win,
		flush: () => f.flushSync(),
		button: /** @type {HTMLButtonElement | null} */ (doc.querySelector('.sh-toggle')),
		panel: /** @type {HTMLElement} */ (doc.querySelector('.sh-panel')),
		probe: () => doc.querySelector('.sh-panel > .sh-body > .probe')
	};
}

test('a collapsed body stays in the DOM as hidden=until-found, and beforematch opens it and reports the change', () => {
	/** @type {boolean[]} */
	const seen = [];
	const ui = render({ collapsible: true, open: false, onchange: (/** @type {boolean} */ o) => seen.push(o) });
	assert.equal(ui.panel.getAttribute('hidden'), 'until-found');
	assert.ok(ui.probe(), 'closed content is in the DOM for find-in-page');
	assert.equal(ui.button?.getAttribute('aria-controls'), ui.panel.id);
	assert.equal(ui.button?.getAttribute('aria-expanded'), 'false');
	ui.panel.dispatchEvent(new ui.win.Event('beforematch'));
	ui.flush();
	assert.equal(ui.panel.hasAttribute('hidden'), false);
	assert.equal(ui.button?.getAttribute('aria-expanded'), 'true');
	assert.deepEqual(seen, [true]);
	ui.panel.dispatchEvent(new ui.win.Event('beforematch'));
	ui.flush();
	assert.deepEqual(seen, [true], 'an open body ignores a repeat match');
	ui.button?.click();
	ui.flush();
	assert.equal(ui.panel.getAttribute('hidden'), 'until-found');
	assert.deepEqual(seen, [true, false], 'the toggle reports through onchange too');
});

test('a non-collapsible header never hides its body', () => {
	const ui = render();
	assert.equal(ui.button, null);
	assert.equal(ui.panel.hasAttribute('hidden'), false);
	assert.ok(ui.probe());
});

test('lazy is opt-in: nothing renders until first opened, then the body is kept findable', () => {
	const ui = render({ collapsible: true, open: false, lazy: true });
	assert.equal(ui.panel.getAttribute('hidden'), '');
	assert.equal(ui.probe(), null);
	ui.button?.click();
	ui.flush();
	assert.ok(ui.probe());
	ui.button?.click();
	ui.flush();
	assert.equal(ui.panel.getAttribute('hidden'), 'until-found');
	assert.ok(ui.probe(), 'kept after closing');
});

test('a collapsed body takes no space: the hidden panel carries no box, spacing lives on the inner body', () => {
	const panel = rule(component, '.sh-panel');
	for (const prop of ['padding', 'padding-top', 'border', 'margin', 'margin-top']) assert.equal(panel[prop], undefined, prop);
	assert.equal(rule(component, '.sh-body')['padding-top'], 'var(--sp-3)');
	assert.equal(panel.display, undefined, 'never overrides the until-found hiding with a display value');
});
