import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';
import { hasDecl, normalize } from './helpers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
/** @param {string} p */
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
const [source, index, readme, page] = await Promise.all([
	read('../src/lib/components/molecules/SplitButton.svelte'),
	read('../src/lib/index.ts'),
	read('../README.md'),
	read('../src/routes/+page.svelte')
]);
const style = source.slice(source.indexOf('<style>'));

const built = await esbuild.build({
	entryPoints: [join(HERE, 'fixtures/mount-split-button.js')],
	bundle: true,
	write: false,
	format: 'iife',
	platform: 'browser',
	conditions: ['svelte', 'browser', 'import'],
	define: { 'import.meta.env.DEV': 'false' },
	alias: { $lib: join(HERE, '../src/lib') },
	plugins: [sveltePlugin({ compilerOptions: { css: 'injected' } })]
});
const bundle = built.outputFiles[0].text;

const OPEN = 'data-popover-open';
const TABBABLE = 'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])';
const settle = () => new Promise((r) => setTimeout(r, 0));

/**
 * jsdom has no Popover API: emulate `showPopover`/`hidePopover` and the
 * `popovertarget` click wiring just enough to fire the `toggle` event Popover
 * listens to.
 * @param {import('jsdom').DOMWindow} win
 */
function polyfillPopover(win) {
	const proto = win.HTMLElement.prototype;
	/** @param {HTMLElement} el @param {'open' | 'closed'} newState */
	const toggle = (el, newState) => {
		const e = new win.Event('toggle');
		Object.assign(e, { oldState: newState === 'open' ? 'closed' : 'open', newState });
		el.dispatchEvent(e);
	};
	proto.showPopover = function () {
		if (this.hasAttribute(OPEN)) return;
		this.setAttribute(OPEN, '');
		toggle(this, 'open');
	};
	proto.hidePopover = function () {
		if (!this.hasAttribute(OPEN)) return;
		this.removeAttribute(OPEN);
		toggle(this, 'closed');
	};
	win.document.addEventListener('click', (e) => {
		const target = /** @type {HTMLElement} */ (e.target);
		const btn = /** @type {HTMLButtonElement | null} */ (target.closest?.('[popovertarget]'));
		if (!btn || btn.disabled) return;
		const panel = win.document.getElementById(btn.getAttribute('popovertarget') ?? '');
		if (!panel) return;
		if (panel.hasAttribute(OPEN)) panel.hidePopover();
		else panel.showPopover();
	});
}

/**
 * @param {Record<string, unknown>} props
 */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	polyfillPopover(dom.window);
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	mount(Fixture, { target: dom.window.document.body, props });
	flushSync();
	const doc = dom.window.document;
	const root = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="SplitButton"]'));
	const primary = /** @type {HTMLButtonElement} */ (root.querySelector('[data-tsu="Button"]'));
	const caret = /** @type {HTMLButtonElement} */ (root.querySelector('[popovertarget]'));
	return {
		doc,
		win: dom.window,
		root,
		primary,
		caret,
		flush: flushSync,
		expanded: () => caret.getAttribute('aria-expanded'),
		menuItems: () =>
			/** @type {HTMLButtonElement[]} */ (Array.from(doc.querySelectorAll('[role="menuitem"]'))),
		/** @param {HTMLElement} el @param {string} key */
		key: (el, key) => {
			el.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
			flushSync();
		}
	};
}

test('the root carries the anchor and spreads rest, class and style', () => {
	assert.match(normalize(source), /<div \{\.\.\.rest\} data-tsu="SplitButton" class="split \{klass\}"/);
	assert.match(source, /style=\{styleProp\}/);
	assert.match(normalize(source), /\.\.\.rest \}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = \$props\(\);/);
});

test('the caret is the kit chevron, sized to the control height, with square inner corners', () => {
	assert.match(source, /<Icon name="chevron-down"/);
	assert.doesNotMatch(source, /▾|▼/);
	assert.ok(hasDecl(style, '.split-caret', 'width', 'var(--split-height)'));
	assert.ok(hasDecl(style, '.split-caret', '--pop-trigger-radius', '0 var(--r-md) var(--r-md) 0'));
	assert.ok(hasDecl(style, '.split-main', '--btn-radius', 'var(--r-md) 0 0 var(--r-md)'));
	assert.ok(hasDecl(style, '.split-caret', 'margin-inline-start', '-1px'));
});

test('the segments are joined through published properties, not :global reach', () => {
	assert.doesNotMatch(style, /:global\(/);
});

test('tokens only: no literal colours in the stylesheet', () => {
	assert.doesNotMatch(style, /#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
});

test('height follows the Button size tiers and the control contract', () => {
	assert.match(source, /sm: 'var\(--control-height-compact\)'/);
	assert.match(source, /md: 'var\(--control-height-default\)'/);
	assert.match(source, /lg: 'var\(--control-height-large\)'/);
	assert.match(source, /control \? 'var\(--control-height\)' : HEIGHT\[size\]/);
	const ui = render({ size: 'sm' });
	assert.equal(ui.root.style.getPropertyValue('--split-height'), 'var(--control-height-compact)');
	assert.equal(render({ control: true }).root.style.getPropertyValue('--split-height'), 'var(--control-height)');
});

test('it is exported, documented and demoed', () => {
	assert.match(index, /export \{ default as SplitButton \} from '\.\/components\/molecules\/SplitButton\.svelte';/);
	assert.match(readme, /### SplitButton/);
	assert.match(page, /<section class="section" id="split-button">/);
	assert.match(page, /<SplitButton[^>]*menuDisabled/);
});

test('clicking the primary fires onclick and does not open the menu', () => {
	let clicks = 0;
	const ui = render({ onclick: () => clicks++ });
	ui.primary.click();
	ui.flush();
	assert.equal(clicks, 1);
	assert.equal(ui.expanded(), 'false');
	assert.equal(ui.menuItems().length, 0);
});

test('the caret carries the popup semantics and opens the menu', async () => {
	const ui = render();
	assert.equal(ui.caret.getAttribute('aria-haspopup'), 'menu');
	assert.equal(ui.caret.getAttribute('aria-label'), 'Send options');
	ui.caret.click();
	await settle();
	ui.flush();
	assert.equal(ui.expanded(), 'true');
	assert.deepEqual(
		ui.menuItems().map((b) => b.textContent?.trim()),
		['Later today', 'Tomorrow 9:00']
	);
	assert.equal(ui.doc.activeElement, ui.menuItems()[0]);
});

test('selecting an item runs it and closes the menu', async () => {
	/** @type {string[]} */
	const picked = [];
	const ui = render({ onselect: (/** @type {string} */ l) => picked.push(l) });
	ui.caret.click();
	await settle();
	ui.flush();
	ui.menuItems()[1].click();
	await settle();
	ui.flush();
	assert.deepEqual(picked, ['Tomorrow 9:00']);
	assert.equal(ui.expanded(), 'false');
});

test('two tab stops, primary first; ArrowDown on the primary opens the menu', async () => {
	const ui = render();
	const stops = Array.from(ui.root.querySelectorAll(TABBABLE));
	assert.deepEqual(stops, [ui.primary, ui.caret]);
	ui.primary.focus();
	ui.key(ui.primary, 'ArrowDown');
	await settle();
	ui.flush();
	assert.equal(ui.expanded(), 'true');
	assert.equal(ui.doc.activeElement, ui.menuItems()[0]);
});

test('a disabled caret still lets the primary work and ignores ArrowDown', async () => {
	let clicks = 0;
	const ui = render({ menuDisabled: true, onclick: () => clicks++ });
	assert.equal(ui.caret.disabled, true);
	assert.equal(ui.primary.disabled, false);
	ui.primary.click();
	ui.flush();
	assert.equal(clicks, 1);
	ui.key(ui.primary, 'ArrowDown');
	await settle();
	ui.flush();
	assert.equal(ui.expanded(), 'false');
	assert.equal(Array.from(ui.root.querySelectorAll(TABBABLE)).length, 1);
});

test('disabled turns off both segments', () => {
	let clicks = 0;
	const ui = render({ disabled: true, onclick: () => clicks++ });
	assert.equal(ui.primary.disabled, true);
	assert.equal(ui.caret.disabled, true);
	ui.primary.click();
	ui.caret.click();
	ui.flush();
	assert.equal(clicks, 0);
	assert.equal(ui.expanded(), 'false');
});

test('the variant reaches both segments', () => {
	const primary = render({ variant: 'primary' });
	assert.ok(primary.primary.classList.contains('btn-primary'));
	assert.ok(primary.caret.classList.contains('trigger-primary'));
	assert.ok(primary.root.classList.contains('split-primary'));
	const danger = render({ variant: 'danger' });
	assert.ok(danger.primary.classList.contains('btn-danger'));
	assert.ok(danger.caret.classList.contains('trigger-danger'));
	assert.ok(!danger.root.classList.contains('split-primary'));
	const sm = render({ size: 'sm' });
	assert.ok(sm.primary.classList.contains('btn-sm'));
	assert.ok(sm.caret.classList.contains('trigger-sm'));
});
