import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-menu-open.js');
const OPEN = 'data-popover-open';
const settle = () => new Promise((r) => setTimeout(r, 0));

/** @param {import('jsdom').DOMWindow} win */
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
}

function render() {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	polyfillPopover(dom.window);
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	mount(Fixture, { target: dom.window.document.body });
	flushSync();
	const doc = dom.window.document;
	/** @param {string} sel */
	const click = (sel) => {
		/** @type {HTMLElement} */ (doc.querySelector(sel)).click();
		flushSync();
	};
	return { doc, click, flush: flushSync, panel: () => /** @type {HTMLElement} */ (doc.querySelector('[popover]')) };
}

test('setting open on a never-opened Menu opens it and focuses the first item', async () => {
	const { doc, click, flush, panel } = render();
	assert.equal(doc.querySelectorAll('[role="menuitem"]').length, 0, 'content is lazy before the first open');
	click('#opener');
	await settle();
	flush();
	assert.ok(panel().hasAttribute(OPEN));
	const items = doc.querySelectorAll('[role="menuitem"]');
	assert.equal(items.length, 2);
	await settle();
	assert.equal(doc.activeElement, items[0]);
	assert.equal(doc.querySelector('[popovertarget]')?.getAttribute('aria-expanded'), 'true');
});

test('setting open back to false closes it, and a native close writes back', async () => {
	const { doc, click, flush, panel } = render();
	click('#opener');
	await settle();
	click('#closer');
	await settle();
	assert.ok(!panel().hasAttribute(OPEN));
	click('#opener');
	await settle();
	panel().hidePopover();
	flush();
	assert.equal(doc.querySelector('#state')?.textContent, 'false');
});
