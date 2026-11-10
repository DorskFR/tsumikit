import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-data-table-loading.js');

/** @param {Record<string, unknown>} [props] */
function render(props = {}) {
	const win = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' }).window;
	win.ResizeObserver = class {
		observe() {}
		disconnect() {}
	};
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	mount(Fixture, { target: win.document.body, props });
	flushSync();
	const root = /** @type {HTMLElement} */ (win.document.querySelector('[data-tsu="DataTable"]'));
	const skeletonRows = /** @type {HTMLElement[]} */ ([...root.querySelectorAll('tr[data-part="skeleton"]')]);
	return { root, skeletonRows };
}

test('loading with no rows renders 5 skeleton rows with one cell per column', () => {
	const { root, skeletonRows } = render();
	assert.equal(skeletonRows.length, 5);
	for (const row of skeletonRows) {
		const cells = [...row.children];
		assert.equal(cells.length, 3);
		for (const cell of cells) {
			assert.equal(cell.tagName, 'TD');
			assert.equal(cell.hasAttribute('colspan'), false);
			const skeleton = /** @type {HTMLElement} */ (cell.querySelector('[data-tsu="Skeleton"]'));
			assert.ok(skeleton.classList.contains('skeleton-text'));
			assert.match(skeleton.style.width, /^\d+%$/);
		}
	}
	assert.equal(root.querySelectorAll('thead th').length, 3);
	assert.equal(root.querySelector('tr[data-part="empty"]'), null);
});

test('no visible loading text row; the label is a visually hidden status and the wrapper is busy', () => {
	const { root } = render();
	assert.equal(root.querySelector('tr[data-part="loading"]'), null);
	assert.equal(root.querySelector('tbody')?.textContent?.trim(), '');
	const status = /** @type {HTMLElement} */ (root.querySelector('[role="status"]'));
	assert.equal(status.textContent, 'Loading rows');
	assert.ok(status.classList.contains('sr-only'));
	assert.equal(root.getAttribute('aria-busy'), 'true');
});

test('loadingRows sets the skeleton row count', () => {
	assert.equal(render({ loadingRows: 8 }).skeletonRows.length, 8);
});

test('skeleton cells carry hideBelow and stacked roles like data cells', () => {
	const plain = render().skeletonRows[0];
	assert.equal(plain.children[1].getAttribute('data-hide-below'), 'sm');
	assert.equal(plain.children[0].hasAttribute('data-role'), false);
	assert.ok(plain.children[1].classList.contains('dt-skeleton-end'));
	const stacked = render({ stack: true }).skeletonRows[0];
	assert.deepEqual(
		[...stacked.children].map((c) => c.getAttribute('data-role')),
		['title', 'detail', 'meta']
	);
});

test('column widths vary across a skeleton row', () => {
	const widths = [...render().skeletonRows[0].querySelectorAll('[data-tsu="Skeleton"]')].map(
		(s) => /** @type {HTMLElement} */ (s).style.width
	);
	assert.equal(new Set(widths).size, widths.length);
});

test('an actions column gets its own skeleton cell at the action button box', () => {
	const { root, skeletonRows } = render({ withActions: true });
	assert.equal(root.querySelectorAll('thead th').length, 4);
	const cell = skeletonRows[0].children[3];
	assert.equal(cell.getAttribute('data-part'), 'actions');
	const bar = /** @type {HTMLElement} */ (cell.querySelector('.skeleton-bar'));
	assert.equal(bar.style.height, 'var(--box-sm)');
});

test('loading with rows keeps the rows and trails one skeleton row', () => {
	const { root, skeletonRows } = render({ rows: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }] });
	assert.equal(root.querySelectorAll('tr[data-part="row"]').length, 2);
	assert.equal(skeletonRows.length, 1);
	assert.equal(root.querySelector('tbody')?.lastElementChild, skeletonRows[0]);
});
