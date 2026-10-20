import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/components/molecules/${p}`, import.meta.url), 'utf8');
const [composerSrc, dropzoneSrc, bundle] = await Promise.all([
	read('Composer.svelte'),
	read('Dropzone.svelte'),
	buildFixture('mount-composer-dropzone-misc.js')
]);

/** @param {Record<string, unknown>} props */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const { window } = dom;
	window.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
	window.HTMLElement.prototype.setPointerCapture = () => {};
	window.HTMLElement.prototype.releasePointerCapture = () => {};
	window.eval(bundle);
	const { mount, flushSync, Fixture } = window.__fixture;
	mount(Fixture, { target: window.document.body, props });
	flushSync();
	const $ = (/** @type {string} */ sel) => {
		const el = window.document.querySelector(sel);
		assert.ok(el, `missing ${sel}`);
		return /** @type {HTMLElement} */ (el);
	};
	return { window, flushSync, $ };
}

/**
 * @param {import('jsdom').DOMWindow} window
 * @param {string} type
 * @param {string[]} types
 */
function drag(window, type, types) {
	const e = new window.Event(type, { bubbles: true, cancelable: true });
	Object.defineProperty(e, 'dataTransfer', { value: { types, files: [], dropEffect: 'none' } });
	return e;
}

test('Composer leaves text drags to the browser and only lights up for file drags', () => {
	const { window, flushSync, $ } = render();
	const root = $('[data-tsu="Composer"]');
	const field = $('[data-tsu="Composer"] textarea');

	const textOver = drag(window, 'dragover', ['text/plain']);
	field.dispatchEvent(textOver);
	assert.equal(textOver.defaultPrevented, false, 'text dragover is not cancelled');
	const textDrop = drag(window, 'drop', ['text/plain']);
	field.dispatchEvent(textDrop);
	assert.equal(textDrop.defaultPrevented, false, 'text drop is not cancelled');
	flushSync();
	assert.ok(!root.classList.contains('dragging'));

	field.dispatchEvent(drag(window, 'dragenter', ['Files']));
	flushSync();
	assert.ok(root.classList.contains('dragging'));
	const fileOver = drag(window, 'dragover', ['Files']);
	field.dispatchEvent(fileOver);
	assert.equal(fileOver.defaultPrevented, true);
	const fileDrop = drag(window, 'drop', ['Files']);
	field.dispatchEvent(fileDrop);
	flushSync();
	assert.equal(fileDrop.defaultPrevented, true);
	assert.ok(!root.classList.contains('dragging'));
});

test('Composer dragging state survives dragleave on a child while the pointer is still inside', () => {
	const { window, flushSync, $ } = render();
	const root = $('[data-tsu="Composer"]');
	const field = $('[data-tsu="Composer"] textarea');
	root.dispatchEvent(drag(window, 'dragenter', ['Files']));
	field.dispatchEvent(drag(window, 'dragenter', ['Files']));
	root.dispatchEvent(drag(window, 'dragleave', ['Files']));
	flushSync();
	assert.ok(root.classList.contains('dragging'), 'still dragging after one of two leaves');
	field.dispatchEvent(drag(window, 'dragleave', ['Files']));
	flushSync();
	assert.ok(!root.classList.contains('dragging'));
	assert.match(composerSrc, /function hasFiles\(e: DragEvent\)/);
});

test('Dropzone overlay lets non-file drops through to the wrapped content', () => {
	const { window, flushSync, $ } = render();
	const text = $('#dz-text');
	const host = $('#dropzone [data-tsu="Dropzone"]');
	const over = drag(window, 'dragover', ['text/plain']);
	text.dispatchEvent(over);
	assert.equal(over.defaultPrevented, false);
	const drop = drag(window, 'drop', ['text/plain']);
	text.dispatchEvent(drop);
	assert.equal(drop.defaultPrevented, false);
	flushSync();
	assert.ok(!host.classList.contains('over'));

	const fileOver = drag(window, 'dragover', ['Files']);
	text.dispatchEvent(fileOver);
	assert.equal(fileOver.defaultPrevented, true);
	assert.equal(/** @type {DragEvent} */ (fileOver).dataTransfer?.dropEffect, 'copy');
	const fileDrop = drag(window, 'drop', ['Files']);
	text.dispatchEvent(fileDrop);
	assert.equal(fileDrop.defaultPrevented, true);
	assert.match(dropzoneSrc, /function onDragOver\(e: DragEvent\) {\s*if \(disabled \|\| !hasFiles\(e\)\) return;/);
	assert.match(dropzoneSrc, /function onDrop\(e: DragEvent\) {\s*if \(!hasFiles\(e\)\) return;/);
});

test('Timestamp trigger is named by the time, with a details suffix', () => {
	const { $ } = render();
	const trigger = $('#timestamp button');
	assert.equal(trigger.getAttribute('aria-label'), '2026-03-04, details');
	assert.equal(trigger.querySelector('time')?.textContent, '2026-03-04');
});

test('SectionHeader collapsible keeps the heading in the tree with the button inside it', () => {
	const { flushSync, $ } = render();
	const h2 = $('#section h2');
	const button = $('#section h2 > button.sh-toggle');
	assert.equal(button.getAttribute('aria-expanded'), 'true');
	assert.equal(h2.textContent?.trim(), 'Queue');
	const panelId = button.getAttribute('aria-controls');
	assert.ok(panelId);
	assert.ok($(`#section [id="${panelId}"].sh-panel`));
	assert.ok(button.querySelector('.sh-icon'), 'icon stays with the title');
	button.click();
	flushSync();
	assert.equal(button.getAttribute('aria-expanded'), 'false');
	assert.equal(button.getAttribute('aria-controls'), null, 'no dangling aria-controls while collapsed');
	assert.equal($('#section').querySelector('.sh-panel'), null);
	assert.ok($('#section button.sh-toggle').closest('h2'), 'heading survives the toggle');
});

test('AttachmentList chip remove buttons are named per file and honour removeLabel', () => {
	/** @type {number[]} */
	const removed = [];
	const a = render({ onremove: (/** @type {number} */ i) => removed.push(i) });
	const labels = [...a.$('#attachments').querySelectorAll('button')].map((b) => b.getAttribute('aria-label'));
	assert.deepEqual(labels, ['Remove a.png', 'Remove b.pdf']);
	/** @type {HTMLButtonElement} */ (a.$('#attachments').querySelectorAll('button')[1]).click();
	assert.deepEqual(removed, [1]);

	const b = render({ removeLabel: 'Supprimer' });
	assert.equal(b.$('#attachments button').getAttribute('aria-label'), 'Supprimer a.png');
});

const crumbs = [
	{ label: 'Home', href: '/' },
	{ label: 'Library' },
	{ label: 'Album', href: '/a' },
	{ label: 'Track' }
];

test('Breadcrumb maxItems=1 still shows the current page', () => {
	const { $ } = render({ crumbs, maxItems: 1 });
	const texts = [...$('#breadcrumb ol').querySelectorAll('li')].map((li) =>
		(li.querySelector('.link, .current, .ellipsis')?.textContent ?? '').trim()
	);
	assert.deepEqual(texts, ['Home', '…', 'Track']);
});

test('Breadcrumb marks only the last crumb aria-current, unlinked middles are plain text', () => {
	const { $ } = render({ crumbs });
	const current = $('#breadcrumb').querySelectorAll('[aria-current="page"]');
	assert.equal(current.length, 1);
	assert.equal(current[0].textContent?.trim(), 'Track');
	const library = [...$('#breadcrumb').querySelectorAll('.current')].find((el) => el.textContent?.trim() === 'Library');
	assert.ok(library);
	assert.equal(library.hasAttribute('aria-current'), false);
	assert.equal($('#breadcrumb').querySelectorAll('a').length, 2);
});

test('CapBar fires onchange when a drag ends on a value different from where it started', () => {
	/** @type {(number | null)[]} */
	const changes = [];
	const { window, flushSync, $ } = render({ cap: 80, onchange: (/** @type {number | null} */ c) => changes.push(c) });
	$('#reset-cap').click();
	flushSync();
	assert.equal($('#capbar .handle').getAttribute('aria-valuenow'), '50');
	const track = $('#capbar .track');
	track.getBoundingClientRect = () => ({ left: 0, width: 100, top: 0, right: 100, bottom: 10, height: 10, x: 0, y: 0, toJSON() {} });
	const pointer = (/** @type {string} */ type, /** @type {number} */ clientX) => {
		const e = new window.Event(type, { bubbles: true, cancelable: true });
		Object.assign(e, { clientX, button: 0, pointerId: 1 });
		track.dispatchEvent(e);
		flushSync();
	};
	pointer('pointerdown', 80);
	pointer('pointerup', 80);
	assert.deepEqual(changes, [80], 'a drag from 50 to 80 commits even though the cap was 80 at mount');
	pointer('pointerdown', 80);
	pointer('pointerup', 80);
	assert.deepEqual(changes, [80], 'a drag that ends where it started commits nothing');
});

test('CapBar keyboard gesture compares against the cap at the first keydown', () => {
	/** @type {(number | null)[]} */
	const changes = [];
	const { window, flushSync, $ } = render({ cap: 80, onchange: (/** @type {number | null} */ c) => changes.push(c) });
	$('#reset-cap').click();
	flushSync();
	const handle = $('#capbar .handle');
	const key = (/** @type {string} */ type, /** @type {string} */ k) => {
		handle.dispatchEvent(new window.KeyboardEvent(type, { key: k, bubbles: true, cancelable: true }));
		flushSync();
	};
	key('keydown', 'ArrowRight');
	key('keydown', 'ArrowLeft');
	key('keyup', 'ArrowLeft');
	assert.deepEqual(changes, [], 'back to the start value: nothing to commit');
	for (let i = 0; i < 6; i++) key('keydown', 'ArrowRight');
	key('keyup', 'ArrowRight');
	assert.deepEqual(changes, [80], 'stepping back to the mount-time cap still commits');
});

test('Metric inline renders a link or button when href / onclick is set', () => {
	let clicks = 0;
	const link = render({ metricHref: '/jobs' }).$('#metric [data-tsu="Metric"]');
	assert.equal(link.tagName, 'A');
	assert.equal(link.getAttribute('href'), '/jobs');
	assert.ok(link.classList.contains('metric-tap'));

	const btn = render({ metricClick: true, onmetric: () => clicks++ });
	const button = btn.$('#metric [data-tsu="Metric"]');
	assert.equal(button.tagName, 'BUTTON');
	assert.equal(button.getAttribute('type'), 'button');
	button.click();
	assert.equal(clicks, 1);

	const plain = render().$('#metric [data-tsu="Metric"]');
	assert.equal(plain.tagName, 'DIV');
	assert.ok(!plain.classList.contains('metric-tap'));
});
