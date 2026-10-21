import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';
import { readDemo } from './helpers/demo-source.js';

const source = await readFile(
	new URL('../src/lib/components/layouts/NavBar.svelte', import.meta.url),
	'utf8'
);
const index = await readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8');
const docs = await readDemo();
const tokens = await readFile(new URL('../src/lib/styles/tokens.css', import.meta.url), 'utf8');
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const css = source.slice(source.indexOf('<style>'));
const bundle = await buildFixture('mount-navbar.svelte.js');

/** @param {Record<string, unknown>} init */
function render(init = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture, props } = dom.window.__fixture;
	const live = props({ clicked: [], ...init });
	mount(Fixture, { target: dom.window.document.body, props: live });
	flushSync();
	const doc = dom.window.document;
	const nav = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="NavBar"]'));
	const items = () => /** @type {HTMLElement[]} */ ([...nav.querySelectorAll('.navbar-link')]);
	const item = (/** @type {string} */ label) =>
		/** @type {HTMLElement} */ (items().find((el) => el.textContent?.includes(label)));
	const sides = () =>
		[...nav.querySelectorAll('.navbar-side')].map((side) =>
			[...side.querySelectorAll('.navbar-link')].map((el) => el.querySelector('.navbar-label')?.textContent)
		);
	const key = (/** @type {string} */ k) => {
		const target = /** @type {HTMLElement} */ (doc.activeElement);
		target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
		flushSync();
	};
	return { doc, nav, items, item, sides, key, props: live, flush: flushSync };
}

test('NavBarItem carries href, value, onclick, label, glyphs, badge and current', () => {
	assert.match(source, /export interface NavBarItem \{/);
	assert.match(source, /href\?: string;/);
	assert.match(source, /value\?: string;/);
	assert.match(source, /onclick\?: \(e: MouseEvent\) => void;/);
	assert.match(source, /controls\?: string;/);
	assert.match(source, /label: string;/);
	assert.match(source, /icon\?: IconName;/);
	assert.match(source, /emoji\?: string;/);
	assert.match(source, /badge\?: number \| string;/);
	assert.match(source, /current\?: boolean;/);
});

test('NavBar prop surface and defaults', () => {
	assert.match(source, /items: NavBarItem\[\];/);
	assert.match(source, /placement = 'inline'/);
	assert.match(source, /placement\?: 'bar' \| 'inline';/);
	assert.match(source, /orientation = 'stacked'/);
	assert.match(source, /orientation\?: 'stacked' \| 'inline';/);
	assert.match(source, /maxWidth\?: string;/);
	assert.match(source, /value = \$bindable\(\)/);
	assert.match(source, /onchange\?: \(value: string\) => void;/);
	assert.match(source, /center\?: Snippet;/);
	assert.match(source, /variant = 'flush'/);
	assert.match(source, /variant\?: 'flush' \| 'floating';/);
	assert.match(source, /class: klass = ''/);
	assert.match(source, /style: styleProp = ''/);
});

test('NavBar is a nav landmark of links marking the current route', () => {
	assert.match(source, /<nav\b/);
	assert.match(source, /aria-label=\{label\}/);
	assert.match(source, /<a\s+href=\{item\.href\}/);
	assert.match(source, /aria-current=\{isCurrent\(item\) \? 'page' : undefined\}/);
});

test('href items render unchanged: links, aria-current from current, no tablist', () => {
	const ui = render({ links: true });
	const links = ui.items();
	assert.equal(links.length, 4);
	assert.ok(links.every((el) => el.tagName === 'A'));
	assert.equal(links[0].getAttribute('href'), '#hud');
	assert.equal(links[0].getAttribute('aria-current'), 'page');
	assert.equal(links[1].hasAttribute('aria-current'), false);
	assert.equal(ui.nav.querySelector('[role="tablist"], [role="tab"], button'), null);
	assert.equal(ui.nav.getAttribute('aria-label'), 'Views');
});

test('items without href are buttons in a tablist that fire onclick and set value', () => {
	const changes = /** @type {string[]} */ ([]);
	const ui = render({ value: 'hud', onchange: (/** @type {string} */ v) => changes.push(v) });
	const list = ui.nav.querySelector('[role="tablist"]');
	assert.ok(list);
	assert.equal(list.getAttribute('aria-label'), 'Views');
	const tabs = ui.items();
	assert.ok(tabs.every((el) => el.tagName === 'BUTTON' && el.getAttribute('type') === 'button'));
	assert.ok(tabs.every((el) => el.getAttribute('role') === 'tab'));
	assert.deepEqual(
		tabs.map((el) => el.getAttribute('aria-selected')),
		['true', 'false', 'false', 'false']
	);
	assert.deepEqual(
		tabs.map((el) => el.getAttribute('tabindex')),
		['0', '-1', '-1', '-1']
	);
	assert.equal(tabs[1].getAttribute('aria-controls'), 'panel-map');
	assert.ok(tabs[0].classList.contains('current'));
	ui.item('MAP').click();
	ui.flush();
	assert.deepEqual([...ui.props.clicked], ['map']);
	assert.deepEqual(changes, ['map']);
	assert.equal(ui.props.value, 'map');
	assert.equal(ui.doc.querySelector('.probe-value')?.textContent, 'map');
	assert.equal(ui.item('MAP').getAttribute('aria-selected'), 'true');
	assert.equal(ui.item('MAP').getAttribute('tabindex'), '0');
	ui.item('MAP').click();
	ui.flush();
	assert.deepEqual(changes, ['map'], 'reselecting the current item does not fire onchange');
});

test('onclick preventDefault keeps the current value', () => {
	const ui = render({ value: 'hud', cancel: 'camera' });
	ui.item('CAMERA').click();
	ui.flush();
	assert.deepEqual([...ui.props.clicked], ['camera']);
	assert.equal(ui.props.value, 'hud');
});

test('value binding flows in from the parent', () => {
	const ui = render({ value: 'hud' });
	ui.props.value = 'logs';
	ui.flush();
	assert.equal(ui.item('LOGS').getAttribute('aria-selected'), 'true');
	assert.equal(ui.item('HUD').getAttribute('aria-selected'), 'false');
});

test('arrow keys, Home and End move focus and select with wraparound', () => {
	const ui = render({ value: 'hud' });
	ui.item('HUD').focus();
	ui.key('ArrowRight');
	assert.equal(ui.props.value, 'map');
	assert.equal(ui.doc.activeElement, ui.item('MAP'));
	ui.key('End');
	assert.equal(ui.props.value, 'logs');
	ui.key('ArrowRight');
	assert.equal(ui.props.value, 'hud');
	ui.key('ArrowLeft');
	assert.equal(ui.props.value, 'logs');
	ui.key('Home');
	assert.equal(ui.props.value, 'hud');
	assert.equal(ui.doc.activeElement, ui.item('HUD'));
});

test('badges render on button items', () => {
	const ui = render({ value: 'hud' });
	assert.equal(ui.item('LOGS').querySelector('.navbar-badge')?.textContent, '3');
	assert.equal(ui.item('MAP').querySelector('.navbar-badge'), null);
});

test('center splits an even count evenly around the notch, outside the tablist', () => {
	const ui = render({ value: 'hud', withCenter: true });
	assert.deepEqual(ui.sides(), [
		['HUD', 'MAP'],
		['CAMERA', 'LOGS']
	]);
	const list = /** @type {HTMLElement} */ (ui.nav.querySelector('[role="tablist"]'));
	assert.ok(list.querySelector('.navbar-notch[aria-hidden="true"]'));
	assert.ok(ui.nav.querySelectorAll('.navbar-side[role="none"]').length === 2);
	const fab = ui.nav.querySelector('.navbar-center .probe-fab');
	assert.ok(fab);
	assert.equal(list.contains(fab), false);
	ui.item('HUD').focus();
	ui.key('ArrowLeft');
	assert.equal(ui.props.value, 'logs', 'keyboard order spans both sides');
});

test('center puts the extra item of an odd count on the start side', () => {
	assert.deepEqual(render({ withCenter: true, count: 3 }).sides(), [['HUD', 'MAP'], ['CAMERA']]);
	assert.deepEqual(render({ withCenter: true, count: 5 }).sides(), [
		['HUD', 'MAP', 'CAMERA'],
		['LOGS', 'MORE']
	]);
	assert.deepEqual(render({ count: 3 }).sides(), [], 'no notch without center');
});

test('without value or current the first tab still takes focus', () => {
	const ui = render();
	assert.equal(ui.items()[0].getAttribute('tabindex'), '0');
	assert.equal(ui.nav.querySelector('[aria-selected="true"]'), null);
});

test('center notch and raise read published custom properties with defaults', () => {
	assert.match(css, /grid-template-columns: minmax\(0, 1fr\) var\(--navbar-center-w, 4\.5rem\) minmax\(0, 1fr\);/);
	assert.ok(hasDecl(css, '.navbar-center', 'width', 'var(--navbar-center-w, 4.5rem)'));
	assert.ok(hasDecl(css, '.navbar-center', 'top', 'calc(-1 * var(--navbar-center-raise, 0px))'));
	assert.match(readme, /\| `NavBar` \| `--navbar-max`, `--navbar-center-w`, `--navbar-center-raise` \|/);
});

test('floating is an inset elevated card; flush keeps the edge-to-edge bar', () => {
	assert.ok(hasDecl(css, '.floating', 'border', '1px solid var(--border-strong)'));
	assert.ok(hasDecl(css, '.floating', 'border-radius', 'var(--r-md)'));
	assert.ok(hasDecl(css, '.floating', 'background', 'var(--bg-elevated)'));
	assert.ok(hasDecl(css, '.floating', 'box-shadow', 'var(--shadow-md)'));
	assert.ok(hasDecl(css, '.bar.floating', 'left', 'calc(var(--sp-2) + var(--safe-left))'));
	assert.ok(hasDecl(css, '.bar.floating', 'right', 'calc(var(--sp-2) + var(--safe-right))'));
	assert.ok(hasDecl(css, '.bar.floating', 'bottom', 'calc(var(--sp-2) + var(--safe-bottom))'));
	assert.ok(hasDecl(css, '.bar', 'inset-inline', '0'));
	assert.ok(hasDecl(css, '.bar', 'border-top', '1px solid var(--border)'));
});

test('items keep the touch target and buttons drop native chrome', () => {
	assert.ok(hasDecl(css, '.navbar-link', 'min-height', 'var(--touch-target)'));
	assert.ok(hasDecl(css, '.navbar-link', 'border', 'none'));
	assert.ok(hasDecl(css, '.navbar-link', 'background', 'none'));
	assert.ok(hasDecl(css, '.navbar-link', 'font', 'inherit'));
});

test('badges skip the falsy counts and the emoji is decorative', () => {
	assert.match(
		source,
		/badge !== undefined && badge !== null && badge !== '' && badge !== 0/
	);
	assert.match(source, /class="navbar-emoji" aria-hidden="true"/);
});

test('bar placement reuses the existing z-index, nav-height and safe-area tokens', () => {
	assert.match(source, /\.bar \{[^}]*position: fixed;/s);
	assert.match(source, /z-index: var\(--z-nav\);/);
	assert.match(source, /padding-bottom: var\(--safe-bottom\);/);
	assert.match(source, /min-height: var\(--nav-h\);/);
	assert.match(tokens, /--z-nav: \d+;/);
	assert.match(tokens, /--safe-bottom: env\(safe-area-inset-bottom/);
	assert.match(tokens, /--nav-h: /);
});

test('maxWidth centres the row through a custom property', () => {
	assert.match(source, /--navbar-max: \$\{maxWidth\}/);
	assert.ok(hasDecl(css, '.navbar-row', 'max-width', 'var(--navbar-max)'));
	assert.match(source, /margin-inline: auto;/);
});

test('NavBar is exported and documented', () => {
	assert.match(
		index,
		/export \{ default as NavBar, type NavBarItem \} from '\.\/components\/layouts\/NavBar\.svelte';/
	);
	assert.match(docs, /\{ id: 'navbar', label: 'NavBar', keywords: '[^']*safe area[^']*' \}/);
	assert.match(docs, /<section class="section" id="navbar">/);
	assert.match(docs, /<NavBar items=\{navBarItems\} label="Demo sections" maxWidth="32rem" \/>/);
	assert.match(docs, /<NavBar items=\{navBarItems\} orientation="inline"/);
	assert.match(docs, /<NavBar\s+items=\{navBarViews\}\s+bind:value=\{navBarView\}[^>]*variant="floating"/);
	assert.match(docs, /\{#snippet center\(\)\}/);
});

test('items keyed by position so two links to the same href cannot collide', () => {
	assert.match(source, /\{#each items as item, i \(`\$\{i\}:\$\{item\.href \?\? item\.value \?\? item\.label\}`\)\}/);
	assert.doesNotMatch(source, /\{#each items as item \(item\.href\)\}/);
});
