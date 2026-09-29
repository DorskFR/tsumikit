import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl, normalize, rule } from './helpers.mjs';

/** @param {string} name */
const component = (name) =>
	readFile(new URL(`../src/lib/components/molecules/${name}`, import.meta.url), 'utf8');
const [disclosure, accordion, index, readme] = await Promise.all([
	component('Disclosure.svelte'),
	component('Accordion.svelte'),
	readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8'),
	readFile(new URL('../README.md', import.meta.url), 'utf8')
]);
const bundle = await buildFixture('mount-disclosure.svelte.js');

/** @param {Record<string, unknown>} init */
function render(init = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture, props } = dom.window.__fixture;
	const live = props(init);
	mount(Fixture, { target: dom.window.document.body, props: live });
	flushSync();
	const doc = dom.window.document;
	const root = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="Disclosure"]'));
	return {
		doc,
		win: dom.window,
		props: live,
		flush: flushSync,
		button: /** @type {HTMLButtonElement} */ (root.querySelector('button')),
		panel: /** @type {HTMLElement} */ (root.querySelector('[role="region"]')),
		root,
		/** @param {string} id */
		item(id) {
			const el = /** @type {HTMLElement} */ (doc.getElementById(`acc-${id}-button`)?.closest('[data-tsu="Disclosure"]'));
			return {
				el,
				button: /** @type {HTMLButtonElement} */ (el.querySelector('button')),
				panel: /** @type {HTMLElement} */ (el.querySelector('[role="region"]')),
				expanded: () => el.querySelector('button')?.getAttribute('aria-expanded') === 'true'
			};
		}
	};
}

test('Disclosure is a native button over a region panel, no keydown interception', () => {
	const src = normalize(disclosure);
	assert.match(src, /<button type="button" id=\{buttonId\}/);
	assert.match(src, /aria-expanded=\{open\}/);
	assert.match(src, /aria-controls=\{panelId\}/);
	assert.match(src, /role="region" aria-labelledby=\{buttonId\} hidden=\{!open\}/);
	assert.doesNotMatch(disclosure, /onkeydown|onkeyup/);
	assert.match(disclosure, /data-tsu="Disclosure"/);
	assert.match(disclosure, /open = \$bindable\(false\)/);
	assert.match(disclosure, /chevron\?: DisclosureChevron/);
	assert.match(disclosure, /type DisclosureChevron = 'start' \| 'end' \| false/);
});

test('the chevron is the kit icon, rotated on open, and still under reduced motion', () => {
	assert.match(disclosure, /<Icon name="chevron-down" \/>/);
	assert.ok(hasDecl(disclosure, '.disclosure--open .disclosure__chevron', 'transform', 'rotate(180deg)'));
	assert.ok(hasDecl(disclosure, '.disclosure__chevron', 'transition', /transform/));
	const reduced = disclosure.slice(disclosure.indexOf('@media (prefers-reduced-motion: reduce)'));
	assert.match(normalize(reduced), /\.disclosure__chevron \{ transition: none; \}/);
});

test('ARIA wiring: button controls the panel, the panel is labelled by the button', () => {
	const ui = render();
	assert.equal(ui.button.id, 'probe-button');
	assert.equal(ui.panel.id, 'probe-panel');
	assert.equal(ui.button.getAttribute('aria-controls'), ui.panel.id);
	assert.equal(ui.panel.getAttribute('aria-labelledby'), ui.button.id);
	assert.equal(ui.button.getAttribute('aria-expanded'), 'false');
	assert.equal(ui.panel.hidden, true);
	assert.equal(ui.doc.querySelector('.probe-header')?.textContent, 'Details');
	assert.equal(ui.doc.querySelector('.probe-header-state')?.textContent, 'off');
});

test('clicking toggles open, fires onchange, and re-renders the header with the new state', () => {
	/** @type {boolean[]} */
	const seen = [];
	const ui = render({ open: false, onchange: (/** @type {boolean} */ o) => seen.push(o) });
	ui.button.click();
	ui.flush();
	assert.equal(ui.button.getAttribute('aria-expanded'), 'true');
	assert.equal(ui.panel.hidden, false);
	assert.equal(ui.doc.querySelector('.probe-header-state')?.textContent, 'on');
	assert.equal(ui.props.open, true, 'bind:open flows back to the parent');
	ui.button.click();
	ui.flush();
	assert.equal(ui.button.getAttribute('aria-expanded'), 'false');
	assert.equal(ui.panel.hidden, true);
	assert.deepEqual(seen, [true, false]);
});

test('Enter and Space reach the native button unprevented, so platform activation toggles it', () => {
	const ui = render();
	for (const key of ['Enter', ' ']) {
		ui.button.focus();
		const down = new ui.win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
		assert.equal(ui.button.dispatchEvent(down), true, `${key} keydown was prevented`);
		const up = new ui.win.KeyboardEvent('keyup', { key, bubbles: true, cancelable: true });
		assert.equal(ui.button.dispatchEvent(up), true, `${key} keyup was prevented`);
		const before = ui.button.getAttribute('aria-expanded');
		ui.button.click();
		ui.flush();
		assert.notEqual(ui.button.getAttribute('aria-expanded'), before);
	}
	assert.equal(ui.button.tagName, 'BUTTON');
	assert.equal(ui.button.type, 'button');
});

test('the parent-driven open value takes over from a local toggle', () => {
	const ui = render({ open: true });
	assert.equal(ui.button.getAttribute('aria-expanded'), 'true');
	ui.button.click();
	ui.flush();
	assert.equal(ui.button.getAttribute('aria-expanded'), 'false');
	ui.props.open = true;
	ui.flush();
	assert.equal(ui.button.getAttribute('aria-expanded'), 'true');
	assert.equal(ui.panel.hidden, false);
});

test('chevron sits before or after the header, or is absent', () => {
	const order = (/** @type {'start' | 'end' | false} */ chevron) => {
		const ui = render({ chevron });
		return [...ui.button.children].map((c) => c.className.split(' ')[0]);
	};
	assert.deepEqual(order('end'), ['disclosure__header', 'disclosure__chevron']);
	assert.deepEqual(order('start'), ['disclosure__chevron', 'disclosure__header']);
	assert.deepEqual(order(false), ['disclosure__header']);
});

test('Accordion is built on Disclosure and accepts title or summary per item', () => {
	assert.match(accordion, /import Disclosure from '\.\/Disclosure\.svelte'/);
	assert.doesNotMatch(accordion, /<details|<summary/);
	assert.match(accordion, /title\?: string;/);
	assert.match(accordion, /summary\?: Snippet<\[AccordionHeaderContext\]>;/);
	assert.match(accordion, /open\?: boolean;/);
	assert.match(accordion, /onchange\?: \(open: boolean\) => void;/);
	assert.match(accordion, /onchange\?: \(id: string, open: boolean\) => void;/);
	assert.match(accordion, /data-tsu="Accordion"/);
	const ui = render();
	assert.equal(ui.item('a').button.querySelector('.acc-title')?.textContent, 'Alpha');
	assert.equal(ui.item('b').button.querySelector('.probe-rich')?.textContent, 'Beta');
	assert.equal(ui.item('b').button.querySelector('.probe-state')?.textContent, 'off');
	ui.item('b').button.click();
	ui.flush();
	assert.equal(ui.item('b').button.querySelector('.probe-state')?.textContent, 'on');
	assert.equal(ui.item('b').panel.hidden, false);
	assert.equal(ui.item('b').panel.getAttribute('aria-labelledby'), 'acc-b-button');
});

test('per-item open is controlled by the parent and reports through both onchange hooks', () => {
	/** @type {string[]} */
	const log = [];
	const ui = render({
		itemOpen: { a: true },
		onItem: (/** @type {string} */ id, /** @type {boolean} */ o) => log.push(`item:${id}:${o}`),
		onItemChange: (/** @type {string} */ id, /** @type {boolean} */ o) => log.push(`acc:${id}:${o}`)
	});
	assert.equal(ui.item('a').expanded(), true);
	ui.item('a').button.click();
	ui.flush();
	assert.equal(ui.item('a').expanded(), false);
	assert.deepEqual(log, ['item:a:false', 'acc:a:false']);
	ui.props.itemOpen = { a: true, c: true };
	ui.flush();
	assert.equal(ui.item('a').expanded(), false, 'an unchanged parent value leaves the local toggle alone');
	assert.equal(ui.item('c').expanded(), true);
	ui.props.itemOpen = { a: false, c: true };
	ui.flush();
	ui.props.itemOpen = { a: true, c: false };
	ui.flush();
	assert.equal(ui.item('a').expanded(), true, 'a new parent value wins over the local toggle');
	assert.equal(ui.item('c').expanded(), false);
});

test('multiple=false closes the other open items and reports each close', () => {
	/** @type {string[]} */
	const log = [];
	const ui = render({
		multiple: false,
		itemOpen: { a: true },
		onItemChange: (/** @type {string} */ id, /** @type {boolean} */ o) => log.push(`${id}:${o}`)
	});
	ui.item('c').button.click();
	ui.flush();
	assert.equal(ui.item('c').expanded(), true);
	assert.equal(ui.item('a').expanded(), false);
	assert.deepEqual(log, ['c:true', 'a:false']);
	const many = render({ itemOpen: { a: true } });
	many.item('c').button.click();
	many.flush();
	assert.equal(many.item('a').expanded(), true, 'multiple=true leaves the others alone');
});

test('Disclosure is exported and documented', () => {
	assert.match(index, /default as Disclosure,\n\} from '\.\/components\/molecules\/Disclosure\.svelte';/);
	assert.match(index, /type DisclosureHeaderContext,/);
	assert.match(readme, /Disclosure \(single collapsible/);
	assert.match(readme, /Accordion \(a stack of Disclosures/);
});

test('Disclosure size="compact" shrinks header and panel through custom properties (TSU-166)', () => {
	// The density knobs are properties, so `compact` is one place to retune and a
	// consumer can reach the same dials without a `:global(` override.
	assert.match(disclosure, /type DisclosureSize = 'default' \| 'compact'/);
	assert.match(disclosure, /size\?: DisclosureSize;/);
	assert.match(disclosure, /size = 'default'/);
	assert.match(disclosure, /class:disclosure--compact={size === 'compact'}/);
	assert.ok(hasDecl(disclosure, '.disclosure__button', 'padding', 'var(--disclosure-pad, var(--sp-3) var(--sp-4))'));
	assert.ok(hasDecl(disclosure, '.disclosure__button', 'font-size', 'var(--disclosure-fs, var(--fs-sm))'));
	assert.ok(hasDecl(disclosure, '.disclosure__panel', 'padding', 'var(--disclosure-panel-pad, 0 var(--sp-4) var(--sp-4))'));
	const compact = rule(disclosure, '.disclosure--compact');
	assert.equal(compact['--disclosure-pad'], 'var(--sp-1) var(--sp-2)');
	assert.equal(compact['--disclosure-fs'], 'var(--fs-xs)');
	assert.equal(compact['--disclosure-panel-pad'], '0 var(--sp-2) var(--sp-2)');
	// Default is untouched: no density class, so every fallback applies.
	assert.equal(render().root.classList.contains('disclosure--compact'), false);
	assert.equal(render({ size: 'compact' }).root.classList.contains('disclosure--compact'), true);
});

test('Accordion forwards size to every item (TSU-166)', () => {
	const ui = render({ size: 'compact' });
	for (const id of ['a', 'b', 'c']) {
		assert.equal(ui.item(id).el.classList.contains('disclosure--compact'), true, `item ${id}`);
	}
	const plainSize = render();
	assert.equal(plainSize.item('a').el.classList.contains('disclosure--compact'), false);
});

test('the summary snippet receives the item it heads, live (TSU-167)', () => {
	assert.match(accordion, /export interface AccordionHeaderContext extends DisclosureHeaderContext \{/);
	assert.match(accordion, /item: AccordionItem;/);
	assert.match(accordion, /{@render item\.summary\(\{ \.\.\.ctx, item \}\)}/);
	const ui = render();
	// One shared snippet can head every item because it is handed the item.
	assert.equal(ui.item('b').button.querySelector('.probe-item')?.textContent, 'b');
	// The open state still arrives alongside it and stays reactive.
	assert.equal(ui.item('b').button.querySelector('.probe-state')?.textContent, 'off');
	ui.item('b').button.click();
	ui.flush();
	assert.equal(ui.item('b').button.querySelector('.probe-state')?.textContent, 'on');
	assert.equal(ui.item('b').button.querySelector('.probe-item')?.textContent, 'b');
});

test('Accordion variant="plain" drops the outer border and radius, keeps the dividers (TSU-168)', () => {
	assert.match(accordion, /type AccordionVariant = 'default' \| 'plain'/);
	assert.match(accordion, /variant\?: AccordionVariant;/);
	assert.match(accordion, /variant = 'default'/);
	assert.match(accordion, /class:accordion--plain={variant === 'plain'}/);
	const plain = rule(accordion, '.accordion--plain');
	assert.equal(plain.border, '0');
	assert.equal(plain['border-radius'], '0');
	// The item dividers are a separate rule, so they survive `plain`.
	assert.match(normalize(accordion), /\.accordion > :global\(\.acc-item \+ \.acc-item\) \{ border-top: 1px solid var\(--border\); \}/);
	assert.ok(hasDecl(accordion, '.accordion', 'border', '1px solid var(--border)'));
	const ui = render({ variant: 'plain' });
	const root = ui.doc.querySelector('[data-tsu="Accordion"]');
	assert.equal(root?.classList.contains('accordion--plain'), true);
	assert.equal(
		ui.doc.querySelector('[data-tsu="Accordion"]')?.querySelectorAll('[data-tsu="Disclosure"]').length,
		3
	);
	assert.equal(
		render().doc.querySelector('[data-tsu="Accordion"]')?.classList.contains('accordion--plain'),
		false
	);
});
