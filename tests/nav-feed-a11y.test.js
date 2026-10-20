import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';

const [navBundle, feedBundle, feedSource, navItemSource] = await Promise.all([
	buildFixture('mount-nav-feed-a11y.svelte.js'),
	buildFixture('mount-conversation.svelte.js'),
	readFile(new URL('../src/lib/components/organisms/ConversationFeed.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/components/layouts/NavItem.svelte', import.meta.url), 'utf8')
]);

function boot(/** @type {string} */ bundle, /** @type {number} */ width) {
	const dom = new JSDOM('<!doctype html><html style="font-size:16px"><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const win = dom.window;
	win.ResizeObserver = class {
		/** @param {ResizeObserverCallback} cb */
		constructor(cb) {
			this.cb = cb;
		}
		/** @param {Element} el */
		observe(el) {
			this.cb([/** @type {ResizeObserverEntry} */ ({ target: el, contentRect: { width } })], /** @type {any} */ (this));
		}
		disconnect() {}
	};
	win.HTMLElement.prototype.getClientRects = function () {
		return /** @type {any} */ (this.closest('[hidden]') ? [] : [{}]);
	};
	win.eval(bundle);
	return win;
}

function renderNav(/** @type {Record<string, unknown>} */ props = {}, width = 300) {
	const win = boot(navBundle, width);
	const { mount, flushSync, Fixture, props: live } = win.__fixture;
	const state = live(props);
	mount(Fixture, { target: win.document.body, props: state });
	flushSync();
	return { win, doc: win.document, state, flush: flushSync, settle: () => new Promise((r) => setTimeout(r, 0)).then(flushSync) };
}

test('MasterDetail on mobile keeps the list mounted, restores its scroll and returns focus to the opened row', async () => {
	const ui = renderNav();
	const list = /** @type {HTMLElement} */ (ui.doc.querySelector('.md-list'));
	const detail = /** @type {HTMLElement} */ (ui.doc.querySelector('.md-detail'));
	assert.ok(ui.doc.querySelector('.md.mobile'));
	assert.equal(list.hidden, false);
	assert.equal(detail.hidden, true);

	const row = /** @type {HTMLElement} */ (ui.doc.querySelector('#row-2'));
	row.focus();
	list.scrollTop = 240;
	ui.state.selected = true;
	ui.flush();
	await ui.settle();
	assert.equal(list.hidden, true);
	assert.equal(detail.hidden, false);
	assert.equal(ui.doc.querySelector('.md-list'), list, 'list pane is not re-created');
	assert.equal(ui.doc.activeElement, ui.doc.querySelector('.md-back'));

	list.scrollTop = 0;
	ui.state.selected = false;
	ui.flush();
	await ui.settle();
	assert.equal(list.hidden, false);
	assert.equal(list.scrollTop, 240);
	assert.equal(ui.doc.activeElement, row);
});

test('MasterDetail does not steal focus on first render or on desktop', async () => {
	const deep = renderNav({ selected: true });
	await deep.settle();
	assert.equal(deep.doc.activeElement, deep.doc.body);

	const desk = renderNav({}, 1200);
	assert.equal(desk.doc.querySelector('.md.mobile'), null);
	desk.state.selected = true;
	desk.flush();
	await desk.settle();
	assert.equal(desk.doc.activeElement, desk.doc.body);
	assert.equal(/** @type {HTMLElement} */ (desk.doc.querySelector('.md-list')).hidden, false);
	assert.equal(/** @type {HTMLElement} */ (desk.doc.querySelector('.md-detail')).hidden, false);
});

test('NavItem name comes from its content, so the badge count is announced', () => {
	const ui = renderNav();
	const item = /** @type {HTMLElement} */ (ui.doc.querySelector('[data-tsu="NavItem"][href="#inbox"]'));
	assert.equal(item.hasAttribute('aria-label'), false);
	assert.equal(item.getAttribute('title'), 'Inbox');
	assert.match(item.textContent ?? '', /Inbox\s*12/);
});

test('NavItem rail hides the label and pill visually, not from assistive tech', () => {
	const rail = navItemSource.slice(navItemSource.indexOf('@container sidebar'));
	assert.doesNotMatch(rail, /\.nav-label,\s*\.nav-trail\s*{\s*display: none/);
	assert.match(rail, /\.nav-label,\s*\.nav-trail\s*{[^}]*clip-path: inset\(50%\);/);
});

test('NavSection with a label is a group named by it; without one it stays a plain list', () => {
	const ui = renderNav();
	const [labelled, plain] = /** @type {HTMLElement[]} */ ([...ui.doc.querySelectorAll('.nav-section-items')]);
	assert.equal(labelled.getAttribute('role'), 'group');
	const id = labelled.getAttribute('aria-labelledby');
	assert.ok(id);
	assert.equal(ui.doc.getElementById(id)?.textContent, 'Projects');
	assert.equal(plain.hasAttribute('role'), false);
	assert.equal(plain.hasAttribute('aria-labelledby'), false);
});

test('Toolbar leaves arrow keys to native radios and roves a radio group as one stop', () => {
	const ui = renderNav();
	const $ = (/** @type {string} */ s) => /** @type {HTMLInputElement} */ (ui.doc.querySelector(s));
	assert.deepEqual(
		['#t-first', '#r-a', '#r-b', '#r-c', '#t-last'].map((s) => $(s).tabIndex),
		[0, -1, -1, -1, -1]
	);

	const press = (/** @type {Element} */ el, /** @type {string} */ key) => {
		const e = new ui.win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
		el.dispatchEvent(e);
		return e;
	};
	$('#t-first').focus();
	press($('#t-first'), 'ArrowRight');
	assert.equal(ui.doc.activeElement, $('#r-b'), 'arrow lands on the checked radio');
	assert.equal($('#r-b').tabIndex, 0);

	const onRadio = press($('#r-b'), 'ArrowRight');
	assert.equal(onRadio.defaultPrevented, false, 'the browser keeps the radio arrow');
	assert.equal(ui.doc.activeElement, $('#r-b'));

	$('#r-c').checked = true;
	$('#r-c').focus();
	assert.deepEqual(
		['#t-first', '#r-a', '#r-b', '#r-c', '#t-last'].map((s) => $(s).tabIndex),
		[-1, -1, -1, 0, -1]
	);
});

function renderFeed(/** @type {Record<string, unknown>} */ props) {
	const win = boot(feedBundle, 800);
	const { mount, flushSync, Fixture, props: live } = win.__fixture;
	const state = live(props);
	mount(Fixture, { target: win.document.body, props: state });
	flushSync();
	const doc = win.document;
	const scroller = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="ConversationFeed"] > .feed'));
	let scrollHeight = 1000;
	let scrollTop = 0;
	Object.defineProperty(scroller, 'scrollHeight', { get: () => scrollHeight, configurable: true });
	Object.defineProperty(scroller, 'clientHeight', { get: () => 300, configurable: true });
	Object.defineProperty(scroller, 'scrollTop', {
		get: () => scrollTop,
		set: (v) => {
			scrollTop = Math.max(0, Math.min(v, scrollHeight - 300));
		},
		configurable: true
	});
	scroller.scrollTo = /** @type {Element['scrollTo']} */ ((/** @type {ScrollToOptions} */ o) => {
		scroller.scrollTop = o.top ?? 0;
	});
	return {
		doc,
		state,
		scroller,
		flush: flushSync,
		log: () => /** @type {HTMLElement} */ (doc.querySelector('.feed-items')),
		grow: (/** @type {number} */ h) => {
			scrollHeight = h;
		},
		scrollTo(/** @type {number} */ top) {
			scroller.scrollTop = top;
			scroller.dispatchEvent(new win.Event('scroll'));
			flushSync();
		},
		frames: () => new Promise((r) => win.requestAnimationFrame(() => win.requestAnimationFrame(() => setTimeout(r, 0)))).then(flushSync),
		settle: () => new Promise((r) => setTimeout(r, 0)).then(flushSync)
	};
}

const msgs = (/** @type {number} */ from, /** @type {number} */ to) =>
	Array.from({ length: to - from + 1 }, (_, i) => ({ id: from + i, text: `msg ${from + i}` }));

test('ConversationFeed items are a named polite log; appends are not marked busy', async () => {
	const ui = renderFeed({ items: msgs(1, 3) });
	await ui.settle();
	assert.equal(ui.log().getAttribute('role'), 'log');
	assert.equal(ui.log().getAttribute('aria-label'), 'Messages');
	ui.state.items = msgs(1, 4);
	ui.flush();
	assert.equal(ui.log().getAttribute('aria-busy'), 'false');
	assert.match(feedSource, /label = 'Messages',/);
});

test('ConversationFeed marks a history prepend busy, then clears it', async () => {
	const ui = renderFeed({ items: msgs(10, 14) });
	await ui.settle();
	ui.state.items = msgs(6, 14);
	ui.flush();
	assert.equal(ui.log().getAttribute('aria-busy'), 'true');
	await ui.frames();
	assert.equal(ui.log().getAttribute('aria-busy'), 'false');
});

test('swapping in a longer conversation jumps to its newest message instead of keeping the old offset', async () => {
	const ui = renderFeed({ items: msgs(1, 10) });
	await ui.settle();
	ui.scrollTo(200);
	ui.state.items = msgs(101, 140);
	ui.flush();
	assert.equal(ui.log().getAttribute('aria-busy'), 'true');
	ui.grow(4000);
	await ui.settle();
	assert.equal(ui.scroller.scrollTop, 3700);
	assert.equal(ui.doc.querySelector('.jump'), null);
});

test('a load that both prepends and appends counts as an append', async () => {
	const ui = renderFeed({ items: msgs(10, 14) });
	await ui.settle();
	ui.grow(1400);
	ui.state.items = msgs(8, 15);
	ui.flush();
	await ui.settle();
	assert.equal(ui.scroller.scrollTop, 1100);
});

test('the jump pill centres without a physical transform, so RTL stays centred', () => {
	assert.ok(hasDecl(feedSource, '.jump', 'inset-inline', '0'));
	assert.ok(hasDecl(feedSource, '.jump', 'margin-inline', 'auto'));
	assert.ok(hasDecl(feedSource, '.jump', 'width', 'fit-content'));
	assert.equal(hasDecl(feedSource, '.jump', 'transform'), false);
});
