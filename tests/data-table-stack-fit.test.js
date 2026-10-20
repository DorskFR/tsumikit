import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { normalize } from './helpers.mjs';

const source = await readFile(
	new URL('../src/lib/components/organisms/DataTable.svelte', import.meta.url),
	'utf8'
);
const css = normalize(source);
const bundle = await buildFixture('mount-data-table-stack.js');

const ROWS = [
	{ id: 1, name: 'one', kind: null, size: '2 MB', age: '2m ago' },
	{ id: 2, name: 'two', kind: 'Artwork', size: '', age: '1h ago' },
	{ id: 3, name: 'three', kind: '', size: '', age: '3d ago' }
];

function setup() {
	const win = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' }).window;
	/** @type {{ cb: ResizeObserverCallback, el?: Element }[]} */
	const observers = [];
	win.ResizeObserver = class {
		/** @param {ResizeObserverCallback} cb */
		constructor(cb) {
			this.o = { cb };
			observers.push(this.o);
		}
		/** @param {Element} el */
		observe(el) {
			this.o.el ??= el;
		}
		disconnect() {}
	};
	let styleReads = 0;
	const gcs = win.getComputedStyle.bind(win);
	win.getComputedStyle = (/** @type {Element} */ el) => {
		styleReads++;
		return gcs(el);
	};
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	/** @param {Record<string, unknown>} props */
	const render = (props = {}) => {
		const host = win.document.createElement('div');
		win.document.body.append(host);
		mount(Fixture, { target: host, props: { rows: ROWS, ...props } });
		flushSync();
		return host;
	};
	/** @param {number} width */
	const resize = (width) => {
		for (const o of observers) {
			if (o.el?.matches('[data-tsu="DataTable"]')) {
				o.cb([/** @type {any} */ ({ contentRect: { width } })], /** @type {any} */ (null));
			}
		}
		flushSync();
	};
	return { win, render, resize, flushSync, reads: () => styleReads };
}

/** Selector text of the stacked separator rule, minus the wrapper scope. */
const separator = (() => {
	const m = css.match(/\[data-stacked\] (td\[data-role='meta'\][^{]*?)::before\s*{\s*content: '·';/);
	assert.ok(m, 'separator rule exists');
	return m[1];
})();

test('stacked tables use a fixed layout so nowrap cells cannot widen the card', () => {
	assert.match(css, /\[data-stacked\] \.dt { table-layout: fixed; }/);
});

test('stackActions defaults to start and only emits data-stack-actions for end in stack mode', () => {
	assert.match(source, /stackActions = 'start'/);
	assert.match(source, /stackActions\?: 'start' \| 'end';/);
	assert.match(css, /\[data-stacked\] td\[data-role='actions'\], \[data-stacked\] td\.dt-actions { flex: none; order: -1;/);
	assert.match(
		css,
		/\[data-stacked\]\[data-stack-actions='end'\] td\[data-role='actions'\], \[data-stacked\]\[data-stack-actions='end'\] td\.dt-actions { order: 2; }/
	);
	const { render } = setup();
	const wrap = (/** @type {Element} */ h) => /** @type {HTMLElement} */ (h.querySelector('[data-tsu="DataTable"]'));
	assert.equal(wrap(render({ withActions: true })).hasAttribute('data-stack-actions'), false);
	assert.equal(wrap(render({ withActions: true, stackActions: 'end' })).dataset.stackActions, 'end');
});

test('null, empty-string and render-nothing snippet cells are empty and hidden when stacked', () => {
	assert.match(css, /\[data-stacked\] td\[data-part='cell'\]\[data-empty\] { display: none; }/);
	const { render } = setup();
	const host = render();
	const rows = Array.from(host.querySelectorAll('tbody tr'));
	const empties = rows.map((tr) =>
		Array.from(tr.querySelectorAll('td')).map((td) => td.hasAttribute('data-empty'))
	);
	assert.deepEqual(empties, [
		[false, true, false, false],
		[false, false, true, false],
		[false, true, true, false]
	]);
});

test('a snippet cell gains and loses data-empty as its content changes', async () => {
	const { render, flushSync } = setup();
	const host = render();
	const cell = () => /** @type {HTMLElement} */ (host.querySelectorAll('tbody tr')[1].querySelectorAll('td')[2]);
	assert.equal(cell().hasAttribute('data-empty'), true);
	cell().append(host.ownerDocument.createElement('svg'));
	await new Promise((r) => setTimeout(r));
	flushSync();
	assert.equal(cell().hasAttribute('data-empty'), false);
	cell().replaceChildren(host.ownerDocument.createTextNode('  '));
	await new Promise((r) => setTimeout(r));
	assert.equal(cell().hasAttribute('data-empty'), true);
});

test('separators sit only between non-empty meta cells, never leading', () => {
	const { render } = setup();
	const host = render();
	const dotted = Array.from(host.querySelectorAll('tbody tr')).map((tr) =>
		Array.from(tr.querySelectorAll('td')).map((td) => td.matches(separator))
	);
	assert.deepEqual(dotted, [
		[false, false, false, true],
		[false, false, false, true],
		[false, false, false, false]
	]);
	assert.match(
		css,
		/td\[data-role='meta'\]:not\(\[data-empty\]\) ~ td\[data-role='meta'\]\[data-stack-label='false'\]:not\(\[data-empty\]\) { margin-inline-start:/
	);
});

test('data-empty is only emitted in stack mode', () => {
	assert.match(
		source,
		/data-empty={responsive === 'stack' && !cellSnippets\[col\.key\] && \(value == null \|\| value === ''\)/
	);
});

test('mounting a stack table reads no computed style; the root font size is cached across tables', () => {
	const { render, resize, reads, win } = setup();
	const a = render();
	assert.equal(reads(), 0, 'no getComputedStyle during mount');
	resize(300);
	assert.equal(reads(), 1, 'root font size read once, after layout');
	assert.ok(a.querySelector('[data-stacked]'));
	render();
	resize(1000);
	assert.equal(reads(), 1, 'cached across tables and resizes');
	assert.equal(a.querySelector('[data-stacked]'), null);
	win.dispatchEvent(new win.Event('resize'));
	resize(300);
	assert.equal(reads(), 2, 'window resize invalidates the cache');
});

test('px and em breakpoints keep working', () => {
	const { render, resize, reads } = setup();
	const px = render({ stackBelow: '500px' });
	resize(499);
	assert.ok(px.querySelector('[data-stacked]'));
	assert.equal(reads(), 0);
	const em = render({ stackBelow: '10em' });
	resize(150);
	assert.ok(em.querySelector('[data-stacked]'));
	assert.ok(reads() >= 1);
});
