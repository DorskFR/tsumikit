import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [button, iconButton, popover, index, readme] = await Promise.all([
	read('components/atoms/Button.svelte'),
	read('components/molecules/IconButton.svelte'),
	read('components/molecules/Popover.svelte'),
	read('index.ts'),
	readFile(new URL('../README.md', import.meta.url), 'utf8')
]);
const { formatCount, hasCount } = await import('../src/lib/count.ts');
const bundle = await buildFixture('mount-count-fixture.js');

/** @param {{ count?: number, countMax?: number }} props */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	mount(Fixture, { target: dom.window.document.body, props });
	flushSync();
	const doc = dom.window.document;
	/** @param {string} id */
	const el = (id) => /** @type {HTMLElement} */ (doc.getElementById(id));
	return {
		el,
		/** @param {string} id */
		pill: (id) => el(id).querySelector('.btn-count, .pop-count'),
		/** @param {string} id */
		name: (id) => el(id).getAttribute('aria-label')
	};
}

test('formatCount/hasCount: hide at 0/undefined, cap past max', () => {
	assert.equal(hasCount(undefined), false);
	assert.equal(hasCount(null), false);
	assert.equal(hasCount(0), false);
	assert.equal(hasCount(-2), false);
	assert.equal(hasCount(Number.NaN), false);
	assert.equal(hasCount(1), true);
	assert.equal(formatCount(7), '7');
	assert.equal(formatCount(99), '99');
	assert.equal(formatCount(100), '99+');
	assert.equal(formatCount(1500, 999), '999+');
	assert.equal(formatCount(4.7), '4');
	assert.match(index, /export \{ formatCount, hasCount \} from '\.\/count';/);
});

test('Button/IconButton/Popover declare count + countMax; IconButton forwards them', () => {
	for (const src of [button, iconButton, popover]) {
		assert.match(src, /count\?: number;/);
		assert.match(src, /countMax\?: number;/);
	}
	assert.match(button, /countMax = 99,/);
	assert.match(popover, /countMax = 99,/);
	assert.match(iconButton, /<Button[^>]*\{count\}[^>]*\{countMax\}/s);
	assert.match(button, /class:btn-counted={counted}/);
	assert.match(button, /<span class="btn-count" aria-hidden="true">{countText}<\/span>/);
	assert.match(popover, /class:counted\b/);
	assert.match(popover, /<span class="pop-count" aria-hidden="true">{countText}<\/span>/);
});

test('the pill is a token-coloured corner overlay that never changes the box', () => {
	for (const [src, host, pill] of [
		[button, '.btn-counted', '.btn-count'],
		[popover, '.pop-trigger.counted', '.pop-count']
	]) {
		assert.ok(hasDecl(src, host, 'position', 'relative'), host);
		assert.ok(hasDecl(src, pill, 'position', 'absolute'));
		assert.ok(hasDecl(src, pill, 'top', '0'));
		assert.ok(hasDecl(src, pill, 'right', '0'));
		assert.ok(hasDecl(src, pill, 'transform', 'translate(45%, -45%)'));
		assert.ok(hasDecl(src, pill, 'border-radius', 'var(--r-pill)'));
		assert.ok(hasDecl(src, pill, 'pointer-events', 'none'));
		assert.ok(hasDecl(src, pill, 'font-size', 'var(--fs-xs)'));
		assert.ok(hasDecl(src, pill, 'font-variant-numeric', 'tabular-nums'));
	}
	assert.ok(hasDecl(button, '.btn-count', 'background', 'var(--btn-count-bg, var(--accent))'));
	assert.ok(hasDecl(button, '.btn-count', 'color', 'var(--btn-count-fg, var(--text-on-accent))'));
	assert.ok(hasDecl(button, '.btn-count', 'min-width', 'var(--btn-count-size, 1.125rem)'));
	assert.ok(hasDecl(button, '.btn-primary .btn-count', 'background', 'var(--btn-count-bg, var(--text-on-accent))'));
	assert.ok(hasDecl(button, '.btn-primary .btn-count', 'color', 'var(--btn-count-fg, var(--accent))'));
	assert.match(button, /\.btn-sm \.btn-count,\s*\.btn-link \.btn-count,\s*\.btn-icon-inline \.btn-count\s*{\s*--btn-count-size: 1rem;/);
	assert.ok(hasDecl(popover, '.pop-count', 'background', 'var(--pop-count-bg, var(--accent))'));
	assert.ok(hasDecl(popover, '.pop-count', 'color', 'var(--pop-count-fg, var(--text-on-accent))'));
	assert.ok(hasDecl(popover, '.trigger-primary .pop-count', 'background', 'var(--pop-count-bg, var(--text-on-accent))'));
	assert.doesNotMatch(button, /\.btn-count\s*{[^}]*#[0-9a-f]{3}/i);
	assert.match(readme, /`--btn-count-bg`, `--btn-count-fg`, `--btn-count-size`/);
	assert.match(readme, /`--pop-count-bg`, `--pop-count-fg`, `--pop-count-size`/);
});

test('no count (undefined/0) renders no pill and leaves the accessible name alone', () => {
	for (const props of [{}, { count: 0 }]) {
		const ui = render(props);
		for (const id of ['text', 'labelled', 'collapsed', 'icon', 'pop']) {
			assert.equal(ui.pill(id), null, `${id} ${JSON.stringify(props)}`);
			assert.equal(ui.el(id).classList.contains('btn-counted') || ui.el(id).classList.contains('counted'), false);
		}
		assert.equal(ui.name('text'), null);
		assert.equal(ui.name('labelled'), 'Inbox');
		assert.equal(ui.name('collapsed'), 'Inbox');
		assert.equal(ui.name('icon'), 'Notifications');
		assert.equal(ui.name('pop'), 'Filters');
		assert.equal(ui.el('text').textContent?.trim(), 'Inbox');
	}
});

test('a count renders the pill on every host and joins the accessible name', () => {
	const ui = render({ count: 5 });
	for (const id of ['text', 'labelled', 'collapsed', 'icon', 'pop']) {
		assert.equal(ui.pill(id)?.textContent, '5', id);
		assert.equal(ui.pill(id)?.getAttribute('aria-hidden'), 'true', id);
	}
	assert.equal(ui.name('labelled'), 'Inbox, 5');
	assert.equal(ui.name('collapsed'), 'Inbox, 5');
	assert.equal(ui.name('icon'), 'Notifications, 5');
	assert.equal(ui.name('pop'), 'Filters, 5');
	assert.equal(ui.name('text'), null);
	const sr = ui.el('text').querySelector('.btn-count-sr');
	assert.equal(sr?.textContent, ', 5');
	assert.equal(sr?.getAttribute('aria-hidden'), null);
	assert.ok(hasDecl(button, '.btn-count-sr', 'clip-path', 'inset(50%)'));
	assert.ok(hasDecl(button, '.btn-count-sr', 'width', '1px'));
});

test('the pill caps at countMax while the accessible name keeps the exact count', () => {
	const capped = render({ count: 120 });
	for (const id of ['text', 'labelled', 'icon', 'pop']) assert.equal(capped.pill(id)?.textContent, '99+', id);
	assert.equal(capped.name('icon'), 'Notifications, 120');
	assert.equal(capped.name('pop'), 'Filters, 120');
	assert.equal(capped.el('text').querySelector('.btn-count-sr')?.textContent, ', 120');

	const wide = render({ count: 120, countMax: 999 });
	for (const id of ['text', 'icon', 'pop']) assert.equal(wide.pill(id)?.textContent, '120', id);
	const over = render({ count: 1500, countMax: 999 });
	for (const id of ['text', 'icon', 'pop']) assert.equal(over.pill(id)?.textContent, '999+', id);
});
