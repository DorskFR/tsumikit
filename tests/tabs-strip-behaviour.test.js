import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-tabs-strip.js');

/** @param {{ value?: string, closable?: boolean, withPanel?: boolean, pinned?: boolean }} props */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.HTMLElement.prototype.scrollIntoView = () => {};
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	/** @type {string[]} */
	const closed = [];
	mount(Fixture, { target: dom.window.document.body, props: { ...props, closed } });
	flushSync();
	const doc = dom.window.document;
	const tablist = /** @type {HTMLElement} */ (doc.querySelector('[role="tablist"]'));
	const tab = (/** @type {string} */ id) =>
		/** @type {HTMLElement} */ (tablist.querySelector(`[role="tab"][id$="-tab-${id}"]`));
	const closeButton = (/** @type {string} */ id) => tab(id).getElementsByTagName('button')[0];
	const ids = () => [...tablist.querySelectorAll('[role="tab"]')].map((el) => el.id.split('-tab-')[1]);
	const selected = () => tablist.querySelector('[role="tab"][aria-selected="true"]')?.id.split('-tab-')[1];
	const key = (/** @type {string} */ k) => {
		const target = doc.activeElement ?? tablist;
		target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
		flushSync();
	};
	const settle = () => new Promise((r) => setTimeout(r, 0));
	return { doc, win: dom.window, tablist, tab, closeButton, ids, selected, key, flush: flushSync, closed, settle };
}

test('strip-only mode renders a tablist without a panel and without aria-controls', () => {
	const ui = render();
	assert.equal(ui.tablist.getAttribute('aria-label'), 'Tabs');
	assert.equal(ui.doc.querySelector('[role="tabpanel"]'), null);
	assert.equal(ui.tab('a').hasAttribute('aria-controls'), false);
	assert.deepEqual(ui.ids(), ['a', 'b', 'c', 'd', 'pinned']);
});

test('with a panel the tabs point at it', () => {
	const ui = render({ withPanel: true });
	const panel = ui.doc.querySelector('[role="tabpanel"]');
	assert.ok(panel);
	assert.equal(ui.tab('a').getAttribute('aria-controls'), panel.id);
	assert.equal(ui.doc.querySelector('.probe-panel')?.textContent, 'b');
});

test('closable tabs are divs with a close button off the Tab order; pinned tabs stay buttons', () => {
	const ui = render();
	assert.equal(ui.tab('a').tagName, 'DIV');
	assert.equal(ui.tab('pinned').tagName, 'BUTTON');
	const close = ui.tab('a').querySelector('button[aria-label="Close tab"]');
	assert.ok(close, 'close control missing');
	assert.equal(close.getAttribute('tabindex'), '-1');
	assert.equal(ui.tab('pinned').querySelector('button[aria-label="Close tab"]'), null);
	assert.equal(ui.tab('a').getAttribute('title'), 'Alpha document');
});

test('roving tabindex: exactly the selected tab is tabbable', () => {
	const ui = render();
	assert.equal(ui.selected(), 'b');
	assert.deepEqual(
		ui.ids().map((id) => ui.tab(id).getAttribute('tabindex')),
		['-1', '0', '-1', '-1', '-1']
	);
});

test('Arrow keys skip the disabled tab and wrap, Home/End jump to the ends', async () => {
	const ui = render();
	ui.tab('b').focus();
	ui.key('ArrowRight');
	assert.equal(ui.selected(), 'd');
	await ui.settle();
	assert.equal(ui.doc.activeElement, ui.tab('d'));
	ui.key('End');
	assert.equal(ui.selected(), 'pinned');
	ui.key('ArrowRight');
	assert.equal(ui.selected(), 'a');
	ui.key('ArrowLeft');
	assert.equal(ui.selected(), 'pinned');
	ui.key('Home');
	assert.equal(ui.selected(), 'a');
});

test('leading and actions snippets render per tab and after the strip', () => {
	const ui = render();
	assert.deepEqual(
		[...ui.doc.querySelectorAll('.probe-leading')].map((el) => el.getAttribute('data-for')),
		['a', 'b', 'c', 'd', 'pinned']
	);
	assert.ok(ui.doc.querySelector('.actions .probe-action'));
});

test('the close button closes its tab without activating it', () => {
	const ui = render();
	ui.closeButton('a').click();
	ui.flush();
	assert.deepEqual(ui.closed, ['a']);
	assert.deepEqual(ui.ids(), ['b', 'c', 'd', 'pinned']);
	assert.equal(ui.selected(), 'b');
});

test('Delete closes the focused tab and moves selection and focus to the next tab', async () => {
	const ui = render();
	ui.tab('b').focus();
	ui.key('Delete');
	assert.deepEqual(ui.closed, ['b']);
	assert.equal(ui.selected(), 'd');
	await ui.settle();
	assert.equal(ui.doc.activeElement, ui.tab('d'));
});

test('closing the last selected tab falls back to the previous selectable one, then to none', () => {
	const ui = render({ value: 'd', pinned: false });
	const close = (/** @type {string} */ id) => {
		ui.closeButton(id).click();
		ui.flush();
	};
	close('d');
	assert.equal(ui.selected(), 'b');
	close('b');
	assert.equal(ui.selected(), 'a');
	close('a');
	assert.equal(ui.selected(), undefined);
	assert.deepEqual(ui.ids(), ['c']);
	assert.deepEqual(ui.closed, ['d', 'b', 'a']);
});

test('Delete on a pinned tab is ignored', () => {
	const ui = render({ value: 'pinned' });
	ui.tab('pinned').focus();
	ui.key('Delete');
	assert.deepEqual(ui.closed, []);
	assert.equal(ui.selected(), 'pinned');
});

test('middle-click closes a tab, left-click only activates it', () => {
	const ui = render();
	const aux = (/** @type {HTMLElement} */ el, /** @type {number} */ button) =>
		el.dispatchEvent(new ui.win.MouseEvent('auxclick', { button, bubbles: true, cancelable: true }));
	ui.tab('a').click();
	ui.flush();
	assert.equal(ui.selected(), 'a');
	assert.deepEqual(ui.closed, []);
	aux(ui.tab('d'), 2);
	ui.flush();
	assert.deepEqual(ui.closed, []);
	aux(ui.tab('d'), 1);
	ui.flush();
	assert.deepEqual(ui.closed, ['d']);
	assert.equal(ui.selected(), 'a');
});

test('closable={false} keeps every tab a plain button with no close control', () => {
	const ui = render({ closable: false });
	for (const id of ui.ids()) assert.equal(ui.tab(id).tagName, 'BUTTON');
	assert.equal(ui.doc.querySelector('button[aria-label="Close tab"]'), null);
	ui.tab('b').focus();
	ui.key('Delete');
	assert.deepEqual(ui.closed, []);
});
