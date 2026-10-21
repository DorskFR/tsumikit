import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const [source, bundle] = await Promise.all([
	readFile(new URL('../src/lib/components/organisms/DataTable.svelte', import.meta.url), 'utf8'),
	buildFixture('mount-data-table-row.js')
]);

function render() {
	const win = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' }).window;
	win.ResizeObserver = class {
		observe() {}
		disconnect() {}
	};
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	/** @type {string[]} */
	const log = [];
	mount(Fixture, { target: win.document.body, props: { log } });
	flushSync();
	const doc = win.document;
	/** @param {string} id */
	const byId = (id) => /** @type {HTMLElement} */ (doc.querySelector(`[data-testid="${id}"]`));
	const row = /** @type {HTMLElement} */ (doc.querySelector('tr[data-part="row"]'));
	/** @param {Element} el @param {string} key */
	const key = (el, key) => {
		const ev = new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
		el.dispatchEvent(ev);
		return ev;
	};
	return { doc, log, byId, row, key };
}

test('clicking a nested control does not also fire the row click', () => {
	const { log, byId } = render();
	byId('act').click();
	assert.deepEqual(log, ['action']);
	log.length = 0;
	/** @type {HTMLElement} */ (byId('act').querySelector('span')).click();
	assert.deepEqual(log, ['action']);
	log.length = 0;
	byId('pick-label').click();
	assert.deepEqual(log, ['pick']);
});

test('clicking a plain cell still fires the row click', () => {
	const { log, row } = render();
	/** @type {HTMLElement} */ (row.querySelectorAll('td')[1]).click();
	assert.deepEqual(log, ['row']);
});

test('Enter/Space on a nested control are left to the control', () => {
	const { log, byId, key } = render();
	for (const k of ['Enter', ' ']) {
		assert.equal(key(byId('act'), k).defaultPrevented, false);
		assert.equal(key(byId('pick'), k).defaultPrevented, false);
	}
	assert.deepEqual(log, []);
});

test('Enter/Space on the focused row activate it', () => {
	const { log, row, key } = render();
	assert.equal(key(row, 'Enter').defaultPrevented, true);
	assert.equal(key(row, ' ').defaultPrevented, true);
	assert.deepEqual(log, ['row', 'row']);
});

test('sort arrow is hidden from the button accessible name', () => {
	const { doc } = render();
	const arrow = doc.querySelector('.dt-sort .dt-arrow');
	assert.equal(arrow?.getAttribute('aria-hidden'), 'true');
});

test('a focused clickable row draws the kit focus ring inset', () => {
	assert.match(
		source,
		/}\s*tr\.clickable:focus-visible\s*{[^}]*outline: var\(--focus-ring\);\s*outline-offset: var\(--focus-ring-offset-inset\);/
	);
	assert.doesNotMatch(source, /tr\.clickable:focus-visible\s*{[^}]*outline: none/);
});

test('stickyHeader documents that it sticks within a bounded-height table, not the page', () => {
	assert.match(source, /only sticks when the table has a bounded height/);
	assert.match(source, /\.dt-scroll\s*{[^}]*overflow-x: auto;/);
});
