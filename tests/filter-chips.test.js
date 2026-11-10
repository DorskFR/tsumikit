import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { fadeEdges, revealDelta, selectedIds, toggleId } from '../src/lib/components/molecules/filter-chips.ts';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-filter-chips.js');
const settle = () => new Promise((r) => setTimeout(r, 0));

/** @param {import('jsdom').DOMWindow} win */
function polyfillPopover(win) {
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
}

/** @param {Record<string, unknown>} [props] */
function render(props = {}) {
	const win = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	}).window;
	polyfillPopover(win);
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	/** @type {(string | string[])[]} */
	const log = [];
	mount(Fixture, { target: win.document.body, props: { log, ...props } });
	flushSync();
	const doc = win.document;
	const root = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="FilterChips"]'));
	/** @param {string} id */
	const chip = (id) => /** @type {HTMLElement} */ (root.querySelector(`[data-chip="${id}"]`));
	const value = () => JSON.parse(/** @type {HTMLElement} */ (doc.getElementById('value')).textContent ?? 'null');
	/** @param {Element} el @param {string} key */
	const key = async (el, key) => {
		const ev = new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
		el.dispatchEvent(ev);
		flushSync();
		await settle();
		return ev;
	};
	/** @param {HTMLElement} el */
	const click = (el) => {
		el.click();
		flushSync();
	};
	return { win, doc, root, log, chip, value, key, click, flush: flushSync };
}

/** @param {Element} el */
const text = (el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

test('single: a radiogroup named by label, click updates the bound value and calls onchange', () => {
	const { root, chip, click, value, log } = render({ value: 'all' });
	const group = /** @type {HTMLElement} */ (root.querySelector('[role="radiogroup"]'));
	assert.equal(group.getAttribute('aria-label'), 'Status');
	assert.equal(root.dataset.form, 'row');
	assert.equal(group.querySelectorAll('[role="radio"]').length, 4);
	assert.equal(chip('all').getAttribute('aria-checked'), 'true');
	assert.equal(chip('all').hasAttribute('aria-pressed'), false);
	click(chip('missing'));
	assert.equal(value(), 'missing');
	assert.deepEqual(log, ['missing']);
	assert.equal(chip('missing').getAttribute('aria-checked'), 'true');
	assert.equal(chip('all').getAttribute('aria-checked'), 'false');
	click(chip('locked'));
	assert.equal(value(), 'missing');
	assert.deepEqual(log, ['missing']);
});

test('single: roving tabindex follows the selection, or the first enabled chip without one', () => {
	const none = render();
	assert.equal(none.chip('all').tabIndex, 0);
	assert.equal(none.chip('missing').tabIndex, -1);
	const some = render({ value: 'complete' });
	assert.equal(some.chip('complete').tabIndex, 0);
	assert.equal(some.chip('all').tabIndex, -1);
});

test('single: arrows, Home and End move and select, skipping disabled chips', async () => {
	const { doc, chip, key, value, log } = render({ value: 'all' });
	assert.equal((await key(chip('all'), 'ArrowRight')).defaultPrevented, true);
	assert.equal(value(), 'missing');
	assert.equal(doc.activeElement, chip('missing'));
	await key(chip('missing'), 'ArrowRight');
	assert.equal(value(), 'complete', 'the disabled chip is skipped');
	await key(chip('complete'), 'ArrowRight');
	assert.equal(value(), 'all', 'wraps');
	await key(chip('all'), 'ArrowLeft');
	assert.equal(value(), 'complete');
	await key(chip('complete'), 'Home');
	assert.equal(value(), 'all');
	await key(chip('all'), 'End');
	assert.equal(value(), 'complete');
	assert.equal(doc.activeElement, chip('complete'));
	assert.deepEqual(log, ['missing', 'complete', 'all', 'complete', 'all', 'complete']);
	assert.equal((await key(chip('complete'), 'a')).defaultPrevented, false);
});

test('counts: thousands separators after the label, 0 shown, absent when undefined', () => {
	const { chip } = render({ value: 'all' });
	assert.equal(text(chip('all')), 'All 3,047');
	assert.equal(chip('missing').querySelector('.count')?.textContent, '0');
	assert.equal(chip('complete').querySelector('.count'), null);
	assert.equal(text(chip('complete')), 'Complete');
});

test('multiple: a group of aria-pressed toggles in normal tab order; clicks toggle ids', async () => {
	const { root, chip, click, key, value, log } = render({ multiple: true, value: ['all'] });
	const group = /** @type {HTMLElement} */ (root.querySelector('[role="group"]'));
	assert.equal(group.getAttribute('aria-label'), 'Status');
	assert.equal(root.querySelector('[role="radio"]'), null);
	assert.equal(chip('all').dataset.tsu, 'Toggle');
	assert.equal(chip('all').getAttribute('aria-pressed'), 'true');
	assert.equal(chip('missing').getAttribute('aria-pressed'), 'false');
	assert.equal(chip('missing').hasAttribute('tabindex'), false);
	assert.equal(/** @type {HTMLButtonElement} */ (chip('locked')).disabled, true);
	click(chip('missing'));
	assert.deepEqual(value(), ['all', 'missing']);
	assert.equal(chip('missing').getAttribute('aria-pressed'), 'true');
	click(chip('all'));
	assert.deepEqual(value(), ['missing']);
	assert.equal(JSON.stringify(log), JSON.stringify([['all', 'missing'], ['missing']]));
	assert.equal((await key(chip('missing'), 'ArrowRight')).defaultPrevented, false);
	assert.deepEqual(value(), ['missing']);
});

test('href: chips are links with aria-current on the selected one; plain clicks select, modified clicks do not', () => {
	const { win, root, chip, value, log, flush } = render({
		value: 'all',
		href: (/** @type {string} */ id) => `?status=${id}`
	});
	assert.equal(root.querySelector('[role="radiogroup"]'), null);
	assert.equal(root.querySelector('[role="group"]')?.getAttribute('aria-label'), 'Status');
	assert.equal(chip('all').tagName, 'A');
	assert.equal(chip('all').getAttribute('href'), '?status=all');
	assert.equal(chip('all').getAttribute('aria-current'), 'page');
	assert.equal(chip('missing').hasAttribute('aria-current'), false);
	assert.equal(chip('locked').tagName, 'BUTTON', 'a disabled option is not a link');
	/** @param {MouseEventInit} init */
	const click = (init) => {
		const ev = new win.MouseEvent('click', { bubbles: true, cancelable: true, ...init });
		chip('missing').dispatchEvent(ev);
		flush();
		return ev;
	};
	click({ ctrlKey: true });
	assert.equal(value(), 'all');
	assert.equal(click({}).defaultPrevented, false, 'navigation is left to the link');
	assert.equal(value(), 'missing');
	assert.deepEqual(log, ['missing']);
	assert.equal(chip('missing').getAttribute('aria-current'), 'page');
});

test('an option href overrides the component href', () => {
	const { chip } = render({
		value: 'all',
		href: (/** @type {string} */ id) => `?status=${id}`,
		options: [
			{ id: 'all', label: 'All' },
			{ id: 'docs', label: 'Docs', href: '/docs' }
		]
	});
	assert.equal(chip('docs').getAttribute('href'), '/docs');
});

test('collapse="always": one dropdown chip with the selected label and count, checkable menu items', async () => {
	const { doc, root, click, value, log, flush } = render({ collapse: 'always', value: 'all' });
	assert.equal(root.dataset.form, 'menu');
	assert.equal(root.querySelector('[data-chip]'), null);
	const trigger = /** @type {HTMLElement} */ (root.querySelector('[popovertarget]'));
	assert.equal(trigger.dataset.tsu, 'Popover');
	assert.ok(trigger.classList.contains('toggle'), 'the trigger is a Toggle chip');
	assert.equal(text(trigger), 'All 3,047');
	assert.equal(trigger.getAttribute('aria-label'), 'Status: All');
	assert.equal(trigger.getAttribute('aria-haspopup'), 'menu');
	assert.ok(trigger.querySelector('svg'), 'caret');

	/** @type {HTMLElement} */ (doc.querySelector('[popover]')).showPopover();
	flush();
	await settle();
	flush();
	const rows = [...doc.querySelectorAll('[role="menuitemcheckbox"]')];
	assert.deepEqual(
		rows.map((r) => [text(r), r.getAttribute('aria-checked')]),
		[
			['All 3,047', 'true'],
			['Missing 0', 'false'],
			['Locked 5', 'false'],
			['Complete', 'false']
		]
	);
	assert.equal(/** @type {HTMLButtonElement} */ (rows[2]).disabled, true);
	click(/** @type {HTMLElement} */ (rows[1]));
	assert.equal(value(), 'missing');
	assert.deepEqual(log, ['missing']);
	assert.equal(text(trigger), 'Missing 0');
	assert.equal(doc.querySelector('[popover]')?.hasAttribute('data-open'), false, 'single select closes the menu');
});

test('collapse="always" multiple: the trigger shows the group label and selected count; the menu stays open', async () => {
	const { doc, root, click, value, flush } = render({ collapse: 'always', multiple: true, value: [] });
	const trigger = /** @type {HTMLElement} */ (root.querySelector('[popovertarget]'));
	assert.equal(text(trigger), 'Status');
	const panel = /** @type {HTMLElement} */ (doc.querySelector('[popover]'));
	panel.showPopover();
	flush();
	await settle();
	flush();
	const row = (/** @type {number} */ i) =>
		/** @type {HTMLElement} */ (doc.querySelectorAll('[role="menuitemcheckbox"]')[i]);
	click(row(0));
	click(row(3));
	assert.deepEqual(value(), ['all', 'complete']);
	assert.equal(panel.hasAttribute('data-open'), true);
	assert.equal(row(0).getAttribute('aria-checked'), 'true');
	assert.equal(text(trigger), 'Status 2');
	assert.equal(trigger.getAttribute('aria-label'), 'Status: All, Complete');
	click(row(0));
	assert.deepEqual(value(), ['complete']);
});

test('collapse="auto" keeps an inert, hidden measuring copy; never/always render none', () => {
	const auto = render({ value: 'all' }).root.querySelector('.measure');
	assert.ok(auto);
	assert.equal(auto.getAttribute('aria-hidden'), 'true');
	assert.equal(auto.hasAttribute('inert'), true);
	assert.equal(auto.querySelector('button, a, [role], [tabindex]'), null);
	assert.equal(render({ collapse: 'never' }).root.querySelector('.measure'), null);
	assert.equal(render({ collapse: 'always' }).root.querySelector('.measure'), null);
});

test('collapse="auto" swaps to the dropdown chip when the measuring copy overflows', () => {
	const win = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' }).window;
	const proto = win.HTMLElement.prototype;
	Object.defineProperty(proto, 'scrollWidth', { get: () => 500 });
	Object.defineProperty(proto, 'clientWidth', { get: () => 300 });
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	mount(Fixture, { target: win.document.body, props: { log: [], value: 'all' } });
	flushSync();
	const root = /** @type {HTMLElement} */ (win.document.querySelector('[data-tsu="FilterChips"]'));
	assert.equal(root.dataset.form, 'menu');
	assert.ok(root.querySelector('[popovertarget]'));
});

test('collapse="never": an overflowing row fades only the edge that hides content', () => {
	const win = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' }).window;
	const proto = win.HTMLElement.prototype;
	let scrollLeft = 0;
	Object.defineProperty(proto, 'scrollWidth', { get: () => 500 });
	Object.defineProperty(proto, 'clientWidth', { get: () => 300 });
	Object.defineProperty(proto, 'scrollLeft', { get: () => scrollLeft, set: () => {} });
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	mount(Fixture, { target: win.document.body, props: { log: [], collapse: 'never' } });
	flushSync();
	const row = /** @type {HTMLElement} */ (win.document.querySelector('[role="radiogroup"]'));
	const fades = () => [row.hasAttribute('data-fade-start'), row.hasAttribute('data-fade-end')];
	assert.deepEqual(fades(), [false, true]);
	for (const [at, want] of /** @type {const} */ ([
		[100, [true, true]],
		[200, [true, false]]
	])) {
		scrollLeft = at;
		row.dispatchEvent(new win.Event('scroll'));
		flushSync();
		assert.deepEqual(fades(), want);
	}
});

test('a row that fits carries no fade or overflow attributes', () => {
	const { root } = render({ collapse: 'never' });
	const row = /** @type {HTMLElement} */ (root.querySelector('[role="radiogroup"]'));
	for (const attr of ['data-overflow', 'data-fade-start', 'data-fade-end']) assert.equal(row.hasAttribute(attr), false);
});

test('helpers', () => {
	assert.deepEqual(selectedIds(undefined), []);
	assert.deepEqual(selectedIds('a'), ['a']);
	assert.deepEqual(selectedIds(['a', 'b']), ['a', 'b']);
	assert.deepEqual(toggleId(['a'], 'b'), ['a', 'b']);
	assert.deepEqual(toggleId(['a', 'b'], 'a'), ['b']);
	assert.deepEqual(fadeEdges(0, 300, 300), { start: false, end: false });
	assert.deepEqual(fadeEdges(0.5, 300.5, 300), { start: false, end: false });
	assert.deepEqual(fadeEdges(0, 500, 300), { start: false, end: true });
	assert.deepEqual(fadeEdges(200, 500, 300), { start: true, end: false });
	assert.deepEqual(fadeEdges(-100, 500, 300), { start: true, end: true });
	assert.equal(revealDelta({ left: 0, right: 300 }, { left: 100, right: 160 }), 0);
	assert.equal(revealDelta({ left: 0, right: 300 }, { left: -40, right: 20 }, 24), -64);
	assert.equal(revealDelta({ left: 0, right: 300 }, { left: 280, right: 340 }, 24), 64);
});
