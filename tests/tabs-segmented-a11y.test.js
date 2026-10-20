import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

/** @param {string} name */
const component = (name) =>
	readFile(new URL(`../src/lib/components/molecules/${name}`, import.meta.url), 'utf8');
const [tabsSrc, segSrc, accSrc] = await Promise.all([
	component('Tabs.svelte'),
	component('SegmentedControl.svelte'),
	component('Accordion.svelte')
]);
const bundle = await buildFixture('mount-tabs-segmented-a11y.js');

/** @param {{ tabValue?: string, segValue?: string }} props */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.HTMLElement.prototype.scrollIntoView = () => {};
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	mount(Fixture, { target: dom.window.document.body, props });
	flushSync();
	const doc = dom.window.document;
	const tablist = /** @type {HTMLElement} */ (doc.querySelector('[role="tablist"]'));
	const group = /** @type {HTMLElement} */ (doc.querySelector('[role="radiogroup"]'));
	/** @param {HTMLElement} root @param {string} role */
	const all = (root, role) => /** @type {HTMLElement[]} */ ([...root.querySelectorAll(`[role="${role}"]`)]);
	/** @param {HTMLElement} root @param {string} role @param {string} suffix */
	const byId = (root, role, suffix) => all(root, role).find((el) => el.id.endsWith(suffix));
	const key = (/** @type {HTMLElement} */ target, /** @type {string} */ k) => {
		target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
		flushSync();
	};
	const settle = () => new Promise((r) => setTimeout(r, 0));
	return {
		doc,
		tablist,
		group,
		tab: (/** @type {string} */ id) => /** @type {HTMLElement} */ (byId(tablist, 'tab', `-tab-${id}`)),
		tabs: () => all(tablist, 'tab'),
		seg: (/** @type {string} */ v) => /** @type {HTMLElement} */ (byId(group, 'radio', `-${v}`)),
		segs: () => all(group, 'radio'),
		key,
		settle
	};
}

test('no id selectors are built from tab ids or option values', () => {
	for (const src of [tabsSrc, segSrc]) {
		assert.doesNotMatch(src, /querySelector(?:<[^>]*>)?\(`#/);
		assert.match(src, /getElementById\(/);
	}
});

test('Tabs: arrow keys move focus to tabs whose ids contain `/`, `.`, `:` and spaces', async () => {
	const ui = render();
	ui.tab('src/app.ts').focus();
	ui.key(ui.tab('src/app.ts'), 'ArrowRight');
	await ui.settle();
	assert.equal(ui.tab('v1.2').getAttribute('aria-selected'), 'true');
	assert.equal(ui.doc.activeElement, ui.tab('v1.2'));
	ui.key(ui.tab('v1.2'), 'ArrowRight');
	await ui.settle();
	assert.equal(ui.doc.activeElement, ui.tab('a b'));
	assert.equal(ui.doc.querySelector('.probe-panel')?.textContent, 'a b');
});

test('Tabs: an unknown value leaves the first enabled tab as the tab stop and arrows work from it', async () => {
	const ui = render({ tabValue: 'gone' });
	assert.deepEqual(
		ui.tabs().map((t) => t.getAttribute('tabindex')),
		['0', '-1', '-1', '-1']
	);
	assert.equal(ui.tablist.querySelector('[aria-selected="true"]'), null);
	ui.key(ui.tab('src/app.ts'), 'ArrowRight');
	await ui.settle();
	assert.equal(ui.tab('v1.2').getAttribute('aria-selected'), 'true');
	assert.equal(ui.doc.activeElement, ui.tab('v1.2'));
});

test('Tabs: a disabled selected tab hands the tab stop to the first enabled tab', () => {
	const ui = render({ tabValue: 'off:limits' });
	assert.equal(ui.tab('off:limits').getAttribute('aria-selected'), 'true');
	assert.equal(ui.tab('off:limits').getAttribute('tabindex'), '-1');
	assert.equal(ui.tab('src/app.ts').getAttribute('tabindex'), '0');
});

test('Tabs: the tabpanel is labelled by the selected tab', () => {
	const ui = render();
	const panel = /** @type {HTMLElement} */ (ui.doc.querySelector('[role="tabpanel"]'));
	assert.equal(panel.getAttribute('aria-labelledby'), ui.tab('src/app.ts').id);
	assert.equal(ui.doc.getElementById(panel.getAttribute('aria-labelledby') ?? '')?.textContent?.trim(), 'app.ts');
});

test('SegmentedControl: arrow keys focus options whose values contain `:`, `.` and spaces', async () => {
	const ui = render();
	ui.seg('v1.2').focus();
	ui.key(ui.seg('v1.2'), 'ArrowRight');
	await ui.settle();
	assert.equal(ui.seg('a b').getAttribute('aria-checked'), 'true');
	assert.equal(ui.doc.activeElement, ui.seg('a b'));
	ui.key(ui.seg('a b'), 'ArrowLeft');
	await ui.settle();
	assert.equal(ui.doc.activeElement, ui.seg('v1.2'));
	ui.key(ui.seg('v1.2'), 'Home');
	await ui.settle();
	assert.equal(ui.doc.activeElement, ui.seg('status:open'));
});

test('SegmentedControl: unknown or disabled value keeps one enabled option in the Tab order', async () => {
	let ui = render({ segValue: 'gone' });
	assert.deepEqual(
		ui.segs().map((s) => s.getAttribute('tabindex')),
		['0', '-1', '-1', '-1']
	);
	ui.key(ui.seg('status:open'), 'ArrowRight');
	await ui.settle();
	assert.equal(ui.seg('v1.2').getAttribute('aria-checked'), 'true');
	assert.equal(ui.doc.activeElement, ui.seg('v1.2'));

	ui = render({ segValue: 'a/b' });
	assert.equal(ui.seg('a/b').getAttribute('aria-checked'), 'true');
	assert.equal(ui.seg('a/b').getAttribute('tabindex'), '-1');
	assert.equal(ui.seg('status:open').getAttribute('tabindex'), '0');
});

test('Accordion: two instances with the same item ids get distinct button/panel ids', () => {
	const ui = render();
	assert.match(accSrc, /const uid = \$props\.id\(\);/);
	assert.match(accSrc, /id=\{`\$\{uid\}-acc-\$\{item\.id\}`\}/);
	const buttons = /** @type {HTMLButtonElement[]} */ ([...ui.doc.querySelectorAll('[data-tsu="Accordion"] button')]);
	const ids = buttons.map((b) => b.id);
	assert.equal(ids.length, 4);
	assert.equal(new Set(ids).size, 4);
	for (const b of buttons) {
		const panel = ui.doc.getElementById(b.getAttribute('aria-controls') ?? '');
		assert.ok(panel, `${b.id} controls a panel`);
		assert.equal(panel.getAttribute('aria-labelledby'), b.id);
		assert.equal(b.closest('[data-tsu="Accordion"]'), panel.closest('[data-tsu="Accordion"]'));
	}
});
