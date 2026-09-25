import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { JSDOM } from 'jsdom';
import { compile, preprocess } from 'svelte/compiler';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl, normalize } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(p, import.meta.url), 'utf8');
const [source, index, readme, page] = await Promise.all([
	read('../src/lib/components/molecules/GlyphStack.svelte'),
	read('../src/lib/index.ts'),
	read('../README.md'),
	read('../src/routes/+page.svelte'),
]);
const css = source.slice(source.indexOf('<style>'));
const flat = normalize(source);
const bundle = await buildFixture('mount-glyph-stack.js');

/** @param {Record<string, unknown>} [props] */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
	});
	const win = /** @type {any} */ (dom.window);
	/** @type {{ target: Element, cb: (entries: { contentRect: { width: number } }[]) => void }[]} */
	const observers = [];
	win.ResizeObserver = class {
		/** @param {(entries: { contentRect: { width: number } }[]) => void} cb */
		constructor(cb) {
			this.cb = cb;
		}
		/** @param {Element} target */
		observe(target) {
			observers.push({ target, cb: this.cb });
		}
		disconnect() {
			const i = observers.findIndex((o) => o.cb === this.cb);
			if (i >= 0) observers.splice(i, 1);
		}
	};
	win.eval(bundle);
	const { mount, unmount, flushSync, Fixture } = win.__fixture;
	const app = mount(Fixture, { target: win.document.body, props });
	flushSync();
	const doc = win.document;
	const root = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="GlyphStack"]'));
	/** @param {number} width */
	const resize = (width) => {
		for (const o of observers) o.cb([{ contentRect: { width } }]);
		flushSync();
	};
	return { doc, root, observers, resize, unmount: () => unmount(app) };
}

test('GlyphStack is exported, documented and demoed with inline, stacked and resizable forms', () => {
	assert.match(normalize(index), /export \{ default as GlyphStack, type GlyphStackItem, \} from '\.\/components\/molecules\/GlyphStack\.svelte';/);
	assert.match(readme, /### GlyphStack/);
	assert.match(readme, /`stack` never \| always \| auto/);
	assert.match(page, /<section class="section" id="glyph-stack">/);
	assert.match(page, /<GlyphStack stack="never" items=\{glyphs\} \/>/);
	assert.match(page, /<GlyphStack stack="always" items=\{glyphs\} \/>/);
	assert.match(page, /<div class="cq glyph-resize">/);
	assert.match(page, /\.glyph-resize \{[^}]*resize: horizontal;/);
});

test('GlyphStack prop surface: items or children, stack mode, stackBelow, container, class passthrough', () => {
	assert.match(source, /export interface GlyphStackItem \{/);
	assert.match(source, /inline: Snippet \| string;/);
	assert.match(source, /stacked\?: Snippet \| string;/);
	assert.match(source, /items\?: GlyphStackItem\[\];/);
	assert.match(source, /children\?: Snippet;/);
	assert.match(source, /stack\?: 'never' \| 'always' \| 'auto';/);
	assert.match(source, /stackBelow\?: string;/);
	assert.match(source, /container\?: string;/);
	assert.match(source, /stack = 'auto'/);
	assert.match(source, /stackBelow = '30rem'/);
	assert.match(flat, /\.\.\.rest \}: Omit<HTMLAttributes<HTMLSpanElement>, keyof Own> & Own = \$props\(\);/);
	assert.match(source, /data-tsu="GlyphStack"/);
	assert.match(source, /class="glyph-stack \{klass\}"/);
	assert.match(source, /\{\.\.\.rest\}/);
});

test('GlyphStack grid: 2×2 of 1rem cells, 1px gap, centred; inline run keeps a token gap', () => {
	assert.equal(hasDecl(css, '.glyph-stack', 'display', 'inline-flex'), true);
	assert.equal(hasDecl(css, '.glyph-stack', 'gap', 'var(--glyph-stack-gap, var(--sp-1))'), true);
	assert.equal(hasDecl(css, '.stacked', 'display', 'inline-grid'), true);
	assert.equal(hasDecl(css, '.stacked', 'grid-template-columns', 'repeat(2, 1rem)'), true);
	assert.equal(hasDecl(css, '.stacked', 'grid-auto-rows', '1rem'), true);
	assert.equal(hasDecl(css, '.stacked', 'gap', '1px'), true);
	assert.equal(hasDecl(css, '.stacked', 'place-items', 'center'), true);
	assert.equal(hasDecl(css, '.stacked > :global(*)', 'width', '1rem'), true);
	assert.equal(hasDecl(css, '.stacked > :global(*)', 'height', '1rem'), true);
	assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
});

test('stack="never" renders the inline run and never observes anything', () => {
	const { root, observers, unmount } = render({ stack: 'never' });
	assert.equal(root.classList.contains('stacked'), false);
	assert.equal(root.dataset.stacked, undefined);
	assert.equal(root.dataset.stack, 'never');
	assert.equal(observers.length, 0);
	assert.equal(root.querySelector('#machine')?.textContent, 'devbox');
	assert.equal(root.querySelector('#machine-tile'), null);
	assert.ok(root.classList.contains('from-consumer'));
	assert.equal(root.dataset.x, 'y');
	unmount();
});

test('stack="always" renders the grid with compact variants, without measuring', () => {
	const { root, observers, unmount } = render({ stack: 'always' });
	assert.equal(root.classList.contains('stacked'), true);
	assert.equal(root.dataset.stacked, 'true');
	assert.equal(observers.length, 0);
	assert.equal(root.querySelector('#machine'), null);
	assert.equal(root.querySelector('#machine-tile')?.textContent, 'd');
	assert.equal(root.querySelectorAll(':scope > .cell').length, 4);
	unmount();
});

test('stack="auto" folds below stackBelow measured on the nearest query container and unfolds again', () => {
	const { root, observers, resize, unmount } = render({ stack: 'auto', stackBelow: '320px' });
	assert.equal(observers.length, 1);
	assert.equal(root.classList.contains('stacked'), false, 'inline until measured');
	resize(500);
	assert.equal(root.classList.contains('stacked'), false);
	assert.equal(root.querySelector('#machine')?.textContent, 'devbox');
	resize(300);
	assert.equal(root.classList.contains('stacked'), true);
	assert.equal(root.dataset.stacked, 'true');
	assert.equal(root.querySelector('#machine'), null);
	assert.equal(root.querySelector('#machine-tile')?.textContent, 'd');
	resize(320);
	assert.equal(root.classList.contains('stacked'), false, 'equal to the limit is not below it');
	unmount();
});

test('stack="auto" converts rem thresholds and observes the nearest query container', () => {
	const { doc, observers, resize, root, unmount } = render({ stack: 'auto', stackBelow: '20rem' });
	assert.equal(observers[0].target, doc.querySelector('#inner'));
	resize(319);
	assert.equal(root.classList.contains('stacked'), true, '20rem at a 16px root is 320px');
	unmount();
});

test('container names the ancestor to measure instead of the nearest one', () => {
	const { doc, observers, unmount } = render({ stack: 'auto', container: 'outer' });
	assert.equal(observers[0].target, doc.querySelector('#outer'));
	unmount();
	assert.match(source, /style\.containerType && style\.containerType !== 'normal'/);
	assert.match(source, /return el\.parentElement;/);
});

test('the grid keeps DOM order: tab stops follow the inline order in both layouts', () => {
	for (const stack of /** @type {const} */ (['never', 'always'])) {
		const { root, unmount } = render({ stack });
		const focusable = [...root.querySelectorAll('button, a[href]')].map((el) => el.id);
		assert.deepEqual(focusable, ['pin', stack === 'always' ? 'machine-tile' : 'machine', 'account'], stack);
		const cells = [...root.children].map((c) => c.firstElementChild?.id);
		assert.deepEqual(cells, ['pin', 'dot', stack === 'always' ? 'machine-tile' : 'machine', 'account'], stack);
		unmount();
	}
});

test('children mode makes each direct child a cell and stacks them in place', () => {
	const { root, unmount } = render({ stack: 'always', mode: 'children' });
	assert.equal(root.classList.contains('stacked'), true);
	assert.deepEqual([...root.children].map((c) => c.id), ['pin', 'dot', 'machine', 'account']);
	unmount();
});

test('more than four items are dropped, not overflowed', () => {
	const { root, unmount } = render({ stack: 'always', count: 5 });
	assert.equal(root.querySelectorAll(':scope > .cell').length, 4);
	assert.equal(root.querySelector('#extra'), null);
	unmount();
});

test('GlyphStack compiles for client and server', async () => {
	const { code } = await preprocess(source, vitePreprocess(), { filename: 'GlyphStack.svelte' });
	for (const generate of /** @type {const} */ (['client', 'server'])) {
		const out = compile(code, { generate, filename: 'GlyphStack.svelte' });
		assert.equal(out.warnings.length, 0, `${generate}: ${out.warnings.map((w) => w.message).join('; ')}`);
	}
});
