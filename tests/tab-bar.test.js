import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';

const source = await readFile(
	new URL('../src/lib/components/layouts/TabBar.svelte', import.meta.url),
	'utf8'
);
const css = source.slice(source.indexOf('<style>'));
const bundle = await buildFixture('mount-tab-bar.svelte.js');

/** @param {Record<string, unknown>} init */
function render(init = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	/** @type {ResizeObserverCallback[]} */
	const observers = [];
	dom.window.ResizeObserver = class {
		/** @param {ResizeObserverCallback} cb */
		constructor(cb) {
			observers.push(cb);
		}
		observe() {}
		unobserve() {}
		disconnect() {}
	};
	dom.window.eval(bundle);
	const { mount, unmount, flushSync, Fixture, props } = dom.window.__fixture;
	const live = props({ selected: [], ...init });
	const app = mount(Fixture, { target: dom.window.document.body, props: live });
	flushSync();
	const doc = dom.window.document;
	const nav = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="TabBar"]'));
	const items = () => /** @type {HTMLElement[]} */ ([...nav.querySelectorAll('.tabbar-item')]);
	const item = (/** @type {string} */ id) =>
		/** @type {HTMLElement} */ (items().find((el) => el.textContent?.includes(id.toUpperCase())));
	const click = (/** @type {Element} */ el) => {
		el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
		flushSync();
	};
	const key = (/** @type {string} */ k) => {
		const target = /** @type {HTMLElement} */ (doc.activeElement);
		target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
		flushSync();
	};
	const current = () => items().filter((el) => el.classList.contains('current')).map((el) => el.querySelector('.tabbar-label')?.textContent);
	const resize = (/** @type {number} */ h) => {
		Object.defineProperty(nav, 'offsetHeight', { value: h, configurable: true });
		for (const cb of observers) cb([/** @type {any} */ ({ target: nav })], /** @type {any} */ ({}));
		flushSync();
	};
	const destroy = () => {
		unmount(app);
		flushSync();
	};
	return { dom, doc, nav, items, item, click, key, current, resize, destroy, props: live, flush: flushSync };
}

test('buttons form a tablist; a click selects, binds value and fires onselect once', () => {
	const r = render({ value: 'home' });
	const list = r.nav.querySelector('[role="tablist"]');
	assert.ok(list);
	assert.equal(list.getAttribute('aria-label'), 'Primary');
	assert.equal(r.items().length, 4);
	assert.ok(r.items().every((el) => el.tagName === 'BUTTON' && el.getAttribute('role') === 'tab'));
	assert.equal(r.item('home').getAttribute('aria-selected'), 'true');
	assert.equal(r.item('home').getAttribute('aria-controls'), 'panel-home');

	r.click(r.item('wanted'));
	assert.equal(r.props.value, 'wanted');
	assert.deepEqual([...r.props.selected], ['wanted']);
	assert.deepEqual(r.current(), ['WANTED']);
	assert.equal(r.item('wanted').getAttribute('aria-selected'), 'true');
	assert.equal(r.item('home').getAttribute('aria-selected'), 'false');

	r.click(r.item('wanted'));
	assert.deepEqual([...r.props.selected], ['wanted']);
});

test('a parent drives selection through bind:value', () => {
	const r = render();
	assert.deepEqual(r.current(), []);
	r.props.value = 'more';
	r.flush();
	assert.deepEqual(r.current(), ['MORE']);
	assert.equal(r.doc.querySelector('.probe-value')?.textContent, 'more');
	assert.deepEqual([...r.props.selected], []);
});

test('roving tabindex: only the selected tab is in the tab order; arrows, Home and End move and select', () => {
	const r = render({ value: 'activity' });
	assert.deepEqual(
		r.items().map((el) => el.tabIndex),
		[-1, 0, -1, -1]
	);
	r.item('activity').focus();
	r.key('ArrowRight');
	assert.equal(r.doc.activeElement, r.item('wanted'));
	assert.equal(r.props.value, 'wanted');
	r.key('ArrowRight');
	r.key('ArrowRight');
	assert.equal(r.doc.activeElement, r.item('home'));
	assert.equal(r.props.value, 'home');
	r.key('ArrowLeft');
	assert.equal(r.doc.activeElement, r.item('more'));
	r.key('Home');
	assert.equal(r.doc.activeElement, r.item('home'));
	r.key('End');
	assert.equal(r.doc.activeElement, r.item('more'));
	assert.deepEqual([...r.props.selected], ['wanted', 'more', 'home', 'more', 'home', 'more']);
	assert.deepEqual(
		r.items().map((el) => el.tabIndex),
		[-1, -1, -1, 0]
	);
});

test('with href the bar is a nav of links with aria-current, arrows move focus without selecting', () => {
	const r = render({ links: true, value: 'home' });
	assert.equal(r.nav.tagName, 'NAV');
	assert.equal(r.nav.getAttribute('aria-label'), 'Primary');
	assert.equal(r.nav.querySelector('[role="tablist"]'), null);
	assert.ok(r.items().every((el) => el.tagName === 'A'));
	assert.equal(r.item('home').getAttribute('aria-current'), 'page');
	assert.equal(r.item('wanted').getAttribute('aria-current'), null);
	assert.equal(r.item('wanted').getAttribute('href'), '#wanted');

	r.item('home').focus();
	r.key('ArrowRight');
	assert.equal(r.doc.activeElement, r.item('activity'));
	assert.equal(r.props.value, 'home');
	r.click(r.item('activity'));
	assert.equal(r.props.value, 'activity');
	assert.equal(r.item('activity').getAttribute('aria-current'), 'page');
	assert.deepEqual([...r.props.selected], ['activity']);
});

test('badges render through Badge: counts cap at 99+, strings verbatim, 0 renders nothing', () => {
	const r = render();
	const badge = (/** @type {string} */ id) => r.item(id).querySelector('[data-tsu="Badge"]');
	assert.equal(badge('activity')?.textContent?.trim(), '99+');
	assert.equal(badge('wanted')?.textContent?.trim(), 'new');
	assert.equal(badge('more'), null);
	assert.equal(badge('home'), null);
});

test('text badges are not clipped by the glyph box and only overlap its 2px outer margin', () => {
	assert.ok(hasDecl(css, '.tabbar :global(.tabbar-badge)', 'max-width', 'none'));
	assert.ok(hasDecl(css, '.tabbar :global(.tabbar-badge)', 'left', 'calc(100% - 2px)'));
	assert.ok(hasDecl(css, '.tabbar :global(.tabbar-badge)', 'padding-inline', 'var(--sp-1-5)'));
});

test('as a bar it publishes --tabbar-h on <html> and removes it on unmount', () => {
	const r = render();
	assert.ok(r.nav.classList.contains('bar'));
	assert.equal(r.doc.documentElement.style.getPropertyValue('--tabbar-h'), '0px');
	r.resize(72);
	assert.equal(r.doc.documentElement.style.getPropertyValue('--tabbar-h'), '72px');
	r.destroy();
	assert.equal(r.doc.documentElement.style.getPropertyValue('--tabbar-h'), '');

	const inline = render({ placement: 'inline' });
	assert.ok(!inline.nav.classList.contains('bar'));
	assert.equal(inline.doc.documentElement.style.getPropertyValue('--tabbar-h'), '');
});

test('fixed bottom with safe-area padding, 48px targets, tokens; reduced motion comes from the reset', () => {
	assert.ok(hasDecl(css, '.bar', 'position', 'fixed'));
	assert.ok(hasDecl(css, '.bar', 'bottom', '0'));
	assert.ok(hasDecl(css, '.bar', 'z-index', 'var(--z-nav)'));
	assert.ok(hasDecl(css, '.bar', 'padding-bottom', /env\(safe-area-inset-bottom/));
	assert.ok(hasDecl(css, '.tabbar-item', 'min-height', /48px/));
	assert.ok(hasDecl(css, '.tabbar-item.current', 'color', 'var(--accent)'));
	assert.ok(hasDecl(css, '.tabbar', 'background', 'var(--bg-elevated)'));
	assert.doesNotMatch(css, /@media \(prefers-reduced-motion: reduce\)/);
	assert.doesNotMatch(css, /#[0-9a-f]{3,6}\b/i);
	assert.match(source, /value = \$bindable\(\)/);
	assert.match(source, /onselect\?: \(id: string, item: TabBarItem\) => void;/);
	assert.match(source, /import Badge from/);
});
