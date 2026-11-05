import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-url-state.svelte.js');

/** @param {string} url */
function boot(url = 'http://localhost/list') {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
		url
	});
	dom.window.eval(bundle);
	const { flushSync, urlState, isModifiedClick, track } = dom.window.__fixture;
	const popstate = () => {
		dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate'));
		flushSync();
	};
	return { win: dom.window, flushSync, urlState, isModifiedClick, track, popstate };
}

test('urlState reads the param, falls back to default, and writes with replaceState', () => {
	const { win, urlState } = boot('http://localhost/list?tab=logs');
	const tab = urlState('tab', { default: 'overview' });
	const view = urlState('view', { default: 'grid' });
	assert.equal(tab.value, 'logs');
	assert.equal(view.value, 'grid');

	const before = win.history.length;
	tab.value = 'alerts';
	assert.equal(win.location.search, '?tab=alerts');
	assert.equal(win.history.length, before);
	assert.equal(tab.value, 'alerts');

	tab.value = 'overview';
	assert.equal(win.location.search, '', 'the default value removes its param');
	assert.equal(tab.value, 'overview');
});

test('urlState round-trips through parse/serialize and keeps other params', () => {
	const { win, urlState } = boot('http://localhost/list?q=open&page=3');
	const page = urlState('page', {
		default: 1,
		parse: (/** @type {string} */ raw) => Number.parseInt(raw, 10) || 1,
		serialize: String
	});
	assert.equal(page.value, 3);
	page.value = 7;
	assert.equal(win.location.search, '?q=open&page=7');
	assert.equal(page.value, 7);
	assert.equal(page.href(2), '/list?q=open&page=2');
	assert.equal(page.href(1), '/list?q=open');
});

test('urlState push opts into pushState and popstate syncs tracked readers', () => {
	const { win, urlState, track, flushSync, popstate } = boot('http://localhost/list');
	const tab = urlState('tab', { default: 'overview', push: true });
	/** @type {string[]} */
	const seen = [];
	const stop = track(() => tab.value, seen);
	flushSync();
	assert.deepEqual(seen, ['overview']);

	const before = win.history.length;
	tab.value = 'logs';
	flushSync();
	assert.equal(win.history.length, before + 1);
	assert.deepEqual(seen, ['overview', 'logs']);

	win.history.replaceState(null, '', '/list?tab=alerts');
	popstate();
	assert.deepEqual(seen, ['overview', 'logs', 'alerts']);
	assert.equal(tab.value, 'alerts');

	stop();
	win.history.replaceState(null, '', '/list');
	popstate();
	assert.deepEqual(seen, ['overview', 'logs', 'alerts'], 'no reader is left after teardown');
	assert.equal(tab.value, 'overview', 'untracked reads still see the URL');
});

test('urlState is SSR-safe: no window at import, default value, href still builds', () => {
	const ctx = vm.createContext({ console, URL, URLSearchParams, queueMicrotask, setTimeout, clearTimeout });
	vm.runInContext(bundle, ctx);
	const { urlState } = ctx.__fixture;
	const tab = urlState('tab', { default: 'overview' });
	assert.equal(tab.value, 'overview');
	tab.value = 'logs';
	assert.equal(tab.value, 'logs');
	assert.equal(tab.href('a b'), '?tab=a%20b');
});

test('isModifiedClick keeps ctrl/meta/shift/alt and non-primary buttons for the browser', () => {
	const { win, isModifiedClick } = boot();
	const click = (/** @type {MouseEventInit} */ init) => new win.MouseEvent('click', init);
	assert.equal(isModifiedClick(click({ button: 0 })), false);
	assert.equal(isModifiedClick(click({ button: 1 })), true);
	assert.equal(isModifiedClick(click({ ctrlKey: true })), true);
	assert.equal(isModifiedClick(click({ metaKey: true })), true);
	assert.equal(isModifiedClick(click({ shiftKey: true })), true);
	assert.equal(isModifiedClick(click({ altKey: true })), true);
});
