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

/** @param {any} win */
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

/** @param {Record<string, unknown>} props */
function renderExpand(props) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
	});
	const win = /** @type {any} */ (dom.window);
	polyfillPopover(win);
	win.ResizeObserver = class {
		observe() {}
		disconnect() {}
	};
	win.eval(bundle);
	const { mount, unmount, flushSync, Fixture } = win.__fixture;
	const app = mount(Fixture, { target: win.document.body, props: { stack: 'always', ...props } });
	flushSync();
	const doc = win.document;
	const root = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="GlyphStack"]'));
	const panel = () => /** @type {HTMLElement | null} */ (doc.querySelector('.expand-panel'));
	const isOpen = () => panel()?.hasAttribute('data-open') ?? false;
	const tiles = () => [...(panel()?.querySelectorAll('.tile') ?? [])];
	const count = (/** @type {string} */ id) => Number(doc.querySelector(`#${id}`)?.textContent);
	const settle = async () => {
		await new Promise((r) => setTimeout(r, 0));
		flushSync();
	};
	/** @param {Element} el @param {string} type @param {Record<string, unknown>} [init] */
	const fire = (el, type, init = {}) => {
		const Ctor = type.startsWith('pointer') ? (win.PointerEvent ?? win.MouseEvent) : win.MouseEvent;
		el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, button: 0, ...init }));
		flushSync();
	};
	/** A real pointer click (`detail` 1) on `el`. */
	const tap = (/** @type {Element} */ el) => fire(el, 'click', { detail: 1 });
	return { win, doc, root, panel, isOpen, tiles, count, settle, fire, tap, unmount: () => unmount(app) };
}

test('expand="none" (default) renders no panel and leaves the cells clickable', () => {
	const { root, panel, tap, count, unmount } = renderExpand({});
	assert.equal(panel(), null);
	assert.equal(root.dataset.expand, undefined);
	tap(/** @type {Element} */ (root.querySelector('#pin')));
	assert.equal(count('pins'), 1);
	unmount();
});

test('expand="tap": a pointer click on the folded stack opens four enlarged tiles instead of hitting a cell', async () => {
	const { root, panel, isOpen, tiles, tap, count, settle, unmount } = renderExpand({ expand: 'tap' });
	assert.equal(root.dataset.expand, 'tap');
	assert.equal(panel()?.getAttribute('popover'), 'manual');
	assert.equal(panel()?.getAttribute('role'), 'group');
	assert.equal(panel()?.getAttribute('aria-label'), 'Session glyphs');
	assert.equal(tiles().length, 0, 'tiles mount only while open');
	tap(/** @type {Element} */ (root.querySelector('#pin')));
	await settle();
	assert.equal(count('pins'), 0, 'the 1rem star is not hit');
	assert.equal(isOpen(), true);
	assert.equal(tiles().length, 4);
	assert.equal(tiles()[0].querySelector('#pin') !== null, true, 'tiles render the inline variant');
	assert.equal(tiles()[1].querySelector('.big-dot') !== null, true, '`expanded` overrides the tile content');
	assert.equal(tiles()[2].querySelector('#machine')?.textContent, 'devbox', 'the full badge, not the compact tile');
	tap(/** @type {Element} */ (tiles()[0].querySelector('#pin')));
	assert.equal(count('pins'), 1, 'tile controls are live');
	assert.equal(isOpen(), true, 'tap panel stays open after a tile click');
	unmount();
});

test('expand="tap": keyboard activation still reaches the cell; outside press and Escape dismiss', async () => {
	const { doc, root, isOpen, tap, fire, count, settle, win, unmount } = renderExpand({ expand: 'tap' });
	fire(/** @type {Element} */ (root.querySelector('#pin')), 'click', { detail: 0 });
	assert.equal(count('pins'), 1, 'detail 0 (keyboard / programmatic) is not intercepted');
	assert.equal(isOpen(), false);
	tap(root);
	await settle();
	assert.equal(isOpen(), true);
	fire(doc.body, 'pointerdown');
	assert.equal(isOpen(), false, 'outside press closes');
	tap(root);
	await settle();
	doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape' }));
	assert.equal(isOpen(), false, 'Escape closes');
	unmount();
});

test('expand only applies while stacked', () => {
	const { root, panel, tap, count, unmount } = renderExpand({ expand: 'tap', stack: 'never' });
	assert.equal(root.dataset.expand, undefined);
	tap(/** @type {Element} */ (root.querySelector('#pin')));
	assert.equal(count('pins'), 1);
	assert.equal(panel()?.hasAttribute('data-open'), false);
	unmount();
	const children = renderExpand({ expand: 'tap', mode: 'children' });
	assert.equal(children.panel(), null, 'children mode has nothing to re-render');
	assert.equal(children.root.dataset.expand, undefined);
	children.unmount();
});

test('expand="slide": press opens, dragging toward a corner arms that tile, release fires its control and closes', async () => {
	const { root, isOpen, tiles, fire, count, settle, unmount } = renderExpand({ expand: 'slide' });
	assert.equal(root.dataset.expand, 'slide');
	fire(root, 'pointerdown', { clientX: 100, clientY: 100 });
	await settle();
	assert.equal(isOpen(), true, 'opens on press, not on release');
	fire(root, 'pointermove', { clientX: 104, clientY: 104 });
	assert.equal(tiles().filter((t) => t.hasAttribute('data-armed')).length, 0, 'inside the threshold nothing is armed');
	fire(root, 'pointermove', { clientX: 80, clientY: 80 });
	assert.equal(tiles()[0].hasAttribute('data-armed'), true, 'up-left arms tile 0');
	fire(root, 'pointermove', { clientX: 130, clientY: 80 });
	assert.equal(tiles()[1].hasAttribute('data-armed'), true, 'up-right arms tile 1');
	fire(root, 'pointermove', { clientX: 130, clientY: 130 });
	assert.equal(tiles()[3].hasAttribute('data-armed'), true, 'down-right arms tile 3');
	assert.equal(tiles()[0].hasAttribute('data-armed'), false);
	fire(root, 'pointerup', { clientX: 130, clientY: 130 });
	await settle();
	assert.equal(count('accounts'), 1, "tile 3's button was clicked");
	assert.equal(isOpen(), false);
	fire(root, 'click', { detail: 1 });
	assert.equal(count('accounts'), 1, 'the trailing click is swallowed');
	unmount();
});

test('expand="slide": item.action wins over the control; a release in place or on a control-less tile keeps the panel open', async () => {
	const { root, isOpen, fire, count, settle, unmount } = renderExpand({ expand: 'slide', withAction: true });
	fire(root, 'pointerdown', { clientX: 100, clientY: 100 });
	fire(root, 'pointermove', { clientX: 80, clientY: 80 });
	fire(root, 'pointerup');
	await settle();
	assert.equal(count('actions'), 1);
	assert.equal(count('pins'), 0, 'action replaces the default click');
	assert.equal(isOpen(), false);

	fire(root, 'pointerdown', { clientX: 100, clientY: 100 });
	fire(root, 'pointerup');
	await settle();
	assert.equal(isOpen(), true, 'a press without a slide acts as tap');

	fire(root, 'pointerdown', { clientX: 100, clientY: 100 });
	fire(root, 'pointermove', { clientX: 130, clientY: 80 });
	fire(root, 'pointerup');
	await settle();
	assert.equal(isOpen(), true, 'the dot tile has nothing to fire, so the panel stays to be read');
	unmount();
});

test('expand="slide": an empty corner arms nothing', async () => {
	const { root, tiles, fire, settle, unmount } = renderExpand({ expand: 'slide', count: 3 });
	fire(root, 'pointerdown', { clientX: 100, clientY: 100 });
	await settle();
	fire(root, 'pointermove', { clientX: 130, clientY: 130 });
	assert.equal(tiles().filter((t) => t.hasAttribute('data-armed')).length, 0);
	fire(root, 'pointercancel');
	unmount();
});

test('expand prop surface and slide styling', () => {
	assert.match(source, /expand\?: 'none' \| 'tap' \| 'slide';/);
	assert.match(source, /expand = 'none'/);
	assert.match(source, /expanded\?: Snippet \| string;/);
	assert.match(source, /action\?: \(\) => void;/);
	assert.equal(hasDecl(css, ".glyph-stack[data-expand='slide']", 'touch-action', 'none'), true);
	assert.equal(hasDecl(css, '.tile-body', 'zoom', 'var(--glyph-stack-zoom, 1.75)'), true);
	assert.match(readme, /`expand` none \| tap \| slide/);
	assert.match(page, /expand="tap"/);
	assert.match(page, /expand="slide"/);
});
