import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-data-table-actions.js');
const OPEN = 'data-popover-open';
const settle = () => new Promise((r) => setTimeout(r, 0));

/** @param {import('jsdom').DOMWindow} win */
function polyfillPopover(win) {
	const proto = win.HTMLElement.prototype;
	proto.showPopover = function () {
		if (this.hasAttribute(OPEN)) return;
		this.setAttribute(OPEN, '');
		this.dispatchEvent(Object.assign(new win.Event('toggle'), { oldState: 'closed', newState: 'open' }));
	};
	proto.hidePopover = function () {
		if (!this.hasAttribute(OPEN)) return;
		this.removeAttribute(OPEN);
		this.dispatchEvent(Object.assign(new win.Event('toggle'), { oldState: 'open', newState: 'closed' }));
	};
	win.document.addEventListener('click', (e) => {
		const invoker = /** @type {Element} */ (e.target).closest('[popovertarget]');
		const target = invoker && win.document.getElementById(invoker.getAttribute('popovertarget') ?? '');
		if (!target) return;
		if (target.hasAttribute(OPEN)) target.hidePopover();
		else target.showPopover();
	});
}

/** @param {Record<string, unknown>} [props] @param {{ coarse?: boolean }} [env] */
function render(props = {}, env = {}) {
	const win = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	}).window;
	win.ResizeObserver = class {
		observe() {}
		disconnect() {}
	};
	if (env.coarse) {
		win.matchMedia = /** @type {any} */ (
			(/** @type {string} */ query) => ({
				matches: query === '(pointer: coarse)',
				addEventListener() {},
				removeEventListener() {}
			})
		);
	}
	polyfillPopover(win);
	win.eval(bundle);
	const { mount, unmount, flushSync, Fixture } = win.__fixture;
	/** @type {string[]} */
	const log = [];
	const app = mount(Fixture, { target: win.document.body, props: { log, ...props } });
	flushSync();
	const doc = win.document;
	const rows = () => /** @type {HTMLElement[]} */ ([...doc.querySelectorAll('tr[data-part="row"]')]);
	/** @param {number} i */
	const actionsCell = (i) => /** @type {HTMLElement} */ (rows()[i].querySelector('td[data-part="actions"]'));
	/** @param {number} i */
	const inline = (i) => /** @type {HTMLElement[]} */ ([...actionsCell(i).querySelectorAll('[data-action]')]);
	/** @param {number} i */
	const menuTrigger = (i) => /** @type {HTMLElement | null} */ (actionsCell(i).querySelector('[popovertarget]'));
	/** @param {number} i */
	const openMenu = async (i) => {
		/** @type {HTMLElement} */ (menuTrigger(i)).click();
		flushSync();
		await settle();
		flushSync();
		return /** @type {HTMLElement[]} */ ([...actionsCell(i).querySelectorAll('[role="menuitem"]')]);
	};
	const state = () =>
		JSON.parse(/** @type {HTMLElement} */ (doc.querySelector('[data-testid="state"]')).textContent ?? '');
	const checkboxes = () =>
		/** @type {HTMLInputElement[]} */ ([...doc.querySelectorAll('[data-tsu="DataTable"] input[type="checkbox"]')]);
	const bar = () => /** @type {HTMLElement | null} */ (doc.querySelector('[data-part="selection-bar"]'));
	/** @param {HTMLElement} el */
	const click = (el) => {
		el.click();
		flushSync();
	};
	/** @param {EventTarget} el @param {string} key */
	const press = (el, key) => {
		el.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
		flushSync();
	};
	const barHeight = () => doc.documentElement.style.getPropertyValue('--selectionbar-h');
	return {
		win, doc, log, rows, actionsCell, inline, menuTrigger, openMenu, state, checkboxes, bar, click, press, barHeight,
		destroy: () => {
			unmount(app);
			flushSync();
		}
	};
}

test('default: one inline icon button and a "more" menu holding the rest', async () => {
	const t = render();
	assert.equal(t.doc.querySelectorAll('thead th').length, 3);
	for (const i of [0, 1, 2]) {
		assert.deepEqual(t.inline(i).map((b) => b.dataset.action), ['open']);
		assert.ok(t.menuTrigger(i));
		assert.equal(t.actionsCell(i).querySelectorAll('button').length, 2);
	}
	const [open] = t.inline(0);
	assert.equal(open.getAttribute('aria-label'), 'Open');
	assert.equal(open.dataset.tsu, 'IconButton');
	assert.ok(open.querySelector('svg'));
	assert.equal(t.menuTrigger(0)?.getAttribute('aria-label'), 'More actions: alpha');
	assert.equal(t.menuTrigger(0)?.getAttribute('aria-haspopup'), 'menu');

	const items = await t.openMenu(1);
	assert.deepEqual(items.map((b) => b.textContent?.trim()), ['Rename', 'Copy', 'Delete']);
	assert.ok(items[2].classList.contains('danger'));
	assert.equal(/** @type {HTMLButtonElement} */ (items[1]).disabled, true);
	t.click(items[0]);
	t.click(t.inline(2)[0]);
	assert.deepEqual(t.log, ['rename:2', 'open:3']);
});

test('inlineActions={2}: two inline (an icon-less one as a text button), rest in the menu', async () => {
	const t = render({ inlineActions: 2 });
	assert.deepEqual(t.inline(0).map((b) => b.dataset.action), ['open', 'rename']);
	assert.equal(t.inline(0)[1].textContent?.trim(), 'Rename');
	assert.equal(t.inline(0)[1].querySelector('svg'), null);
	assert.deepEqual((await t.openMenu(0)).map((b) => b.textContent?.trim()), ['Copy', 'Delete']);
});

test('a single action renders inline with no menu', () => {
	const t = render({ count: 1 });
	assert.deepEqual(t.inline(0).map((b) => b.dataset.action), ['open']);
	assert.equal(t.menuTrigger(0), null);
	assert.equal(t.actionsCell(0).querySelectorAll('button').length, 1);
});

test('all actions fitting inline leave no menu', () => {
	const t = render({ count: 2, inlineActions: 2 });
	assert.equal(t.inline(0).length, 2);
	assert.equal(t.menuTrigger(0), null);
});

test('a coarse pointer caps inline actions at one', () => {
	const t = render({ inlineActions: 3 }, { coarse: true });
	assert.equal(t.inline(0).length, 1);
	assert.equal(t.actionsCell(0).querySelectorAll('button').length, 2);
});

test('the rowActions snippet still renders, before the built-in actions', () => {
	const t = render({ snippet: true });
	const buttons = [...t.actionsCell(0).querySelectorAll('button')];
	assert.equal(buttons[0].getAttribute('data-testid'), 'custom-1');
	assert.equal(buttons[1].getAttribute('data-action'), 'open');
	assert.equal(t.doc.querySelectorAll('thead th').length, 3);
	t.click(/** @type {HTMLElement} */ (buttons[0]));
	assert.deepEqual(t.log, ['custom:1']);

	const alone = render({ snippet: true, count: 0 });
	assert.equal(alone.actionsCell(0).querySelectorAll('button').length, 1);
	assert.equal(alone.doc.querySelector('.dt-actions-head .sr-only')?.textContent, 'Actions');
});

test('selectable shows no checkbox, select column or bar until selecting', () => {
	const t = render({ selectable: true });
	assert.equal(t.checkboxes().length, 0);
	assert.equal(t.doc.querySelector('.dt-select'), null);
	assert.equal(t.bar(), null);
	assert.equal(t.barHeight(), '');
	assert.equal(t.doc.querySelectorAll('thead th').length, 3);
});

test('without selectable the row menu has no Select item', async () => {
	const t = render();
	assert.equal((await t.openMenu(0)).some((b) => b.textContent?.trim() === 'Select'), false);
});

test('the trailing "Select" menu item enters selection mode with that row selected', async () => {
	const t = render({ selectable: true });
	const items = await t.openMenu(1);
	assert.deepEqual(items.map((b) => b.textContent?.trim()), ['Rename', 'Copy', 'Delete', 'Select']);
	t.click(items[3]);
	assert.deepEqual(t.state(), { selected: [2], selecting: true });
	const boxes = t.checkboxes();
	assert.equal(boxes.length, 4);
	assert.deepEqual(boxes.map((b) => b.checked), [false, false, true, false]);
	assert.equal(boxes[0].indeterminate, true);
	assert.equal(t.rows()[1].hasAttribute('data-selected'), true);
	assert.equal(t.doc.querySelectorAll('thead th').length, 4);
	assert.equal(boxes[2].closest('label')?.textContent?.trim(), 'Select beta');
	assert.equal(boxes[0].closest('label')?.textContent?.trim(), 'Select all');
});

test('a single inline action still gets a menu for "Select" when selectable', async () => {
	const t = render({ selectable: true, count: 1 });
	assert.equal(t.inline(0).length, 1);
	assert.deepEqual((await t.openMenu(0)).map((b) => b.textContent?.trim()), ['Select']);
});

test('while selecting, a row click toggles the row and does not call onrowclick', () => {
	const t = render({ selectable: true, clickable: true });
	const cell = () => /** @type {HTMLElement} */ (t.rows()[0].querySelector('td[data-part="cell"]'));
	t.click(cell());
	assert.deepEqual(t.log, ['row:1']);
	t.log.length = 0;

	t.click(/** @type {HTMLElement} */ (t.doc.querySelector('[data-testid="enter"]')));
	t.click(cell());
	assert.deepEqual(t.state().selected, [1]);
	t.click(/** @type {HTMLElement} */ (t.rows()[2].querySelector('td[data-part="cell"]')));
	assert.deepEqual(t.state().selected, [1, 3]);
	t.click(cell());
	assert.deepEqual(t.state().selected, [3]);
	t.press(t.rows()[1], 'Enter');
	t.press(t.rows()[2], ' ');
	assert.deepEqual(t.state().selected, [2]);
	assert.equal(t.rows()[1].getAttribute('aria-selected'), 'true');
	assert.deepEqual(t.log, []);
});

test('a row checkbox toggles its row once', () => {
	const t = render({ selectable: true, clickable: true, start: true });
	t.click(t.checkboxes()[2]);
	assert.deepEqual(t.state().selected, [2]);
	t.click(t.checkboxes()[2]);
	assert.deepEqual(t.state().selected, []);
	assert.deepEqual(t.log, []);
});

test('select-all checks every visible row, is indeterminate when partial, and clears', () => {
	const t = render({ selectable: true, start: true });
	const all = () => t.checkboxes()[0];
	assert.equal(all().checked, false);
	assert.equal(all().indeterminate, false);
	t.click(t.checkboxes()[1]);
	assert.equal(all().indeterminate, true);
	assert.equal(all().checked, false);
	t.click(all());
	assert.deepEqual(t.state().selected, [1, 2, 3]);
	assert.equal(all().checked, true);
	assert.equal(all().indeterminate, false);
	assert.deepEqual(t.checkboxes().map((b) => b.checked), [true, true, true, true]);
	t.click(all());
	assert.deepEqual(t.state().selected, []);
});

test('the selection bar shows the count, the bulk snippet with the selected rows and Done', () => {
	const t = render({ selectable: true, start: true, bulk: true });
	const bar = /** @type {HTMLElement} */ (t.bar());
	assert.equal(bar.closest('[data-tsu="DataTable"]'), null);
	assert.equal(bar.getAttribute('popover'), 'manual');
	assert.ok(bar.hasAttribute(OPEN));
	const count = /** @type {HTMLElement} */ (bar.querySelector('[aria-live="polite"]'));
	assert.equal(count.textContent, '0 selected');
	t.click(t.checkboxes()[1]);
	t.click(t.checkboxes()[3]);
	assert.equal(count.textContent, '2 selected');
	assert.equal(bar.querySelector('[data-testid="bulk"]')?.textContent, 'alpha,gamma');

	const done = /** @type {HTMLElement} */ ([...bar.querySelectorAll('button')].at(-1));
	assert.equal(done.textContent?.trim(), 'Done');
	t.click(done);
	assert.deepEqual(t.state(), { selected: [], selecting: false });
	assert.equal(t.bar(), null);
	assert.equal(t.checkboxes().length, 0);
});

test('Escape leaves selection mode and clears the selection', () => {
	const t = render({ selectable: true, start: true });
	t.click(t.checkboxes()[1]);
	assert.deepEqual(t.state(), { selected: [1], selecting: true });
	t.press(t.doc.body, 'Escape');
	assert.deepEqual(t.state(), { selected: [], selecting: false });
	assert.equal(t.checkboxes().length, 0);
});

test('Escape inside an open popover is left to that popover', async () => {
	const t = render({ selectable: true, start: true });
	t.click(t.checkboxes()[1]);
	const items = await t.openMenu(0);
	t.press(items[0], 'Escape');
	assert.equal(t.state().selecting, true);
	assert.deepEqual(t.state().selected, [1]);
});

test('setting selecting to false from outside clears the selection', async () => {
	const t = render({ selectable: true });
	t.click((await t.openMenu(0)).at(-1) ?? t.doc.body);
	assert.deepEqual(t.state().selected, [1]);
	t.click(/** @type {HTMLElement} */ ([...(t.bar()?.querySelectorAll('button') ?? [])].at(-1)));
	assert.deepEqual(t.state(), { selected: [], selecting: false });
});

test('--selectionbar-h is published on <html> while selecting and removed after', () => {
	const t = render({ selectable: true });
	assert.equal(t.barHeight(), '');
	t.click(/** @type {HTMLElement} */ (t.doc.querySelector('[data-testid="enter"]')));
	assert.match(t.barHeight(), /^calc\(\d+px \+ var\(--sp-4\)\)$/);
	t.press(t.doc.body, 'Escape');
	assert.equal(t.barHeight(), '');

	t.click(/** @type {HTMLElement} */ (t.doc.querySelector('[data-testid="enter"]')));
	assert.notEqual(t.barHeight(), '');
	t.destroy();
	assert.equal(t.barHeight(), '');
});

test('coarse pointers: inline row actions and the more trigger are full 44px boxes', async () => {
	const { readFile } = await import('node:fs/promises');
	const src = await readFile(new URL('../src/lib/components/organisms/DataTable.svelte', import.meta.url), 'utf8');
	const coarse = src.slice(src.indexOf('@media (pointer: coarse)'));
	assert.match(coarse, /\.dt-actions-inner {\s*--box-sm: var\(--touch-target\);/);
});
