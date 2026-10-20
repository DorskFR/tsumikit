import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
const [source, readme, page] = await Promise.all([
	read('../src/lib/components/organisms/DataTable.svelte'),
	read('../README.md'),
	read('../src/routes/+page.svelte')
]);
const bundle = await buildFixture('mount-data-table.js');

const COLUMNS = [
	{ key: 'pick', label: 'Select all', sortable: true },
	{ key: 'name', label: 'Name', role: 'title' },
	{ key: 'role', label: 'Role', role: 'meta', stackLabel: false },
	{ key: 'status', label: 'Status', role: 'meta' },
	{ key: 'id', label: 'Id', role: 'detail', stackLabel: true }
];

/** @param {Record<string, unknown>} props */
function render(props = {}) {
	const win = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' }).window;
	win.ResizeObserver = class {
		observe() {}
		disconnect() {}
	};
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	mount(Fixture, { target: win.document.body, props: { columns: COLUMNS, ...props } });
	flushSync();
	return { win, doc: win.document, flushSync };
}

test('Column.stackLabel is an optional boolean, emitted only when false in stack mode', () => {
	assert.match(source, /stackLabel\?: boolean;/);
	assert.match(
		source,
		/data-stack-label={responsive === 'stack' && col\.stackLabel === false \? 'false' : undefined}/
	);
});

test('stackLabel:false cells carry data-stack-label; labelled cells do not', () => {
	const { doc } = render();
	const cells = Array.from(doc.querySelector('tbody tr')?.querySelectorAll('td') ?? []);
	const byRole = Object.fromEntries(cells.map((td, i) => [COLUMNS[i].key, td]));
	assert.equal(byRole.role.dataset.stackLabel, 'false');
	assert.equal(byRole.role.dataset.label, 'Role');
	assert.equal(byRole.status.hasAttribute('data-stack-label'), false);
	assert.equal(byRole.id.hasAttribute('data-stack-label'), false);
});

test('bare cells drop the label, metas join with a dot, details share lines', () => {
	assert.match(source, /\[data-stacked\] td\[data-stack-label='false'\]::before\s*{\s*content: none;/);
	assert.match(
		source,
		/\[data-stacked\]\s+td\[data-role='meta'\]:not\(\[data-empty\]\)\s+~ td\[data-role='meta'\]\[data-stack-label='false'\]:not\(\[data-empty\]\)::before\s*{\s*content: '·';/
	);
	assert.match(
		source,
		/\[data-stacked\]\s+td\[data-role='meta'\]:not\(\[data-empty\]\)\s+~ td\[data-role='meta'\]\[data-stack-label='false'\]:not\(\[data-empty\]\)\s*{\s*margin-inline-start: calc\(var\(--sp-1\) - var\(--sp-3\)\);/
	);
	assert.match(source, /\[data-stacked\] td\[data-role='detail'\]\[data-stack-label='false'\]\s*{\s*flex: 0 1 auto;/);
	const noLabel = source.indexOf("td[data-stack-label='false']::before");
	assert.ok(noLabel > source.indexOf("td[data-role='meta']::before"), 'opt-out must follow the label rules');
	assert.ok(noLabel > source.indexOf("td[data-role='detail']::before"));
});

test('stacked labels use the body font; meta values default to mono but can be overridden', () => {
	assert.match(source, /\[data-stacked\] td\[data-role='meta'\]\s*{[^}]*font-family: var\(--dt-meta-font, var\(--font-mono\)\);/s);
	assert.match(source, /\[data-stacked\] td\[data-role='meta'\]::before\s*{[^}]*font-family: var\(--font-sans\);/s);
	assert.doesNotMatch(source, /::before\s*{[^}]*font-mono/s);
});

test('headerSnippets is a per-column record that replaces the header content', () => {
	assert.match(source, /headerSnippets = {}/);
	assert.match(source, /headerSnippets\?: Record<string, Snippet<\[Column<T>\]>>;/);
	assert.match(source, /{#if headerSnippets\[col\.key\]}\s*{@render headerSnippets\[col\.key\]\(col\)}\s*{:else if col\.sortable}/);
});

test('a header snippet renders a working select-all checkbox instead of the label or sort button', () => {
	/** @type {boolean[]} */
	const calls = [];
	const { doc, flushSync } = render({ onpickall: (/** @type {boolean} */ c) => calls.push(c) });
	const th = /** @type {HTMLElement} */ (doc.querySelector('thead th'));
	const box = /** @type {HTMLInputElement} */ (th.querySelector('[data-testid="pick-all"]'));
	assert.ok(box);
	assert.equal(box.getAttribute('aria-label'), 'Select all');
	assert.equal(th.querySelector('.dt-sort'), null);
	assert.equal(th.textContent?.trim(), '');
	assert.equal(doc.querySelectorAll('thead th')[1].textContent?.trim(), 'Name');
	box.click();
	flushSync();
	assert.deepEqual(calls, [true]);
});

test('README and demo page document both stack modes and the header snippet', () => {
	assert.match(readme, /`Column\.stackLabel: false`/);
	assert.match(readme, /`headerSnippets\[key\]`/);
	assert.match(page, /stackLabel: false/);
	assert.match(page, /headerSnippets={{ pick: pickAll }}/);
	assert.match(page, /columns={stackCols}/);
});
