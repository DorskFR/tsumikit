import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { compile } from 'svelte/compiler';
import { autoresize, fieldSizingSupported } from '../src/lib/autoresize.ts';
import { buildFixture } from './fixtures/build.mjs';

/** @param {boolean} supported */
function stubEngine(supported) {
	// @ts-expect-error minimal stub
	globalThis.CSS = { supports: (/** @type {string} */ prop, /** @type {string} */ value) => supported && prop === 'field-sizing' && value === 'content' };
	// @ts-expect-error minimal stub
	globalThis.getComputedStyle = () => ({ boxSizing: 'border-box', fontSize: '16px', lineHeight: '20px', paddingTop: '8px', paddingBottom: '8px', borderTopWidth: '1px', borderBottomWidth: '1px' });
}

/** @param {number} rows */
function stubTextarea(rows) {
	/** @type {Map<string, () => void>} */
	const listeners = new Map();
	/** @type {Record<string, string>} */
	const props = {};
	let measured = 0;
	const node = {
		rows,
		className: 'textarea',
		clientWidth: 100,
		get scrollHeight() {
			measured++;
			return 54;
		},
		style: {
			height: '',
			minHeight: '',
			/** @param {string} k @param {string} v */
			setProperty(k, v) {
				props[k] = v;
			},
			/** @param {string} k */
			removeProperty(k) {
				delete props[k];
			}
		},
		/** @param {string} type @param {() => void} fn */
		addEventListener(type, fn) {
			listeners.set(type, fn);
		},
		/** @param {string} type */
		removeEventListener(type) {
			listeners.delete(type);
		}
	};
	return { node, props, listeners, measured: () => measured, input: () => listeners.get('input')?.() };
}

test('autoresize hands sizing to field-sizing: content when the engine supports it', () => {
	stubEngine(true);
	assert.equal(fieldSizingSupported(), true);
	const ta = stubTextarea(3);
	const action = autoresize(/** @type {any} */ (ta.node), '');
	assert.equal(ta.props['field-sizing'], 'content');
	assert.equal(ta.node.style.height, '', 'the engine owns the height');
	assert.equal(ta.node.style.minHeight, '78px', 'rows stay a floor');
	for (let i = 0; i < 5; i++) {
		ta.input();
		action.update();
	}
	assert.equal(ta.measured(), 0, 'no scrollHeight reads per keystroke');
	assert.equal(ta.node.style.height, '');
	action.destroy();
	assert.equal(ta.props['field-sizing'], undefined);
	assert.equal(ta.listeners.size, 0);
});

test('native autoresize keeps the drag floor above the rows floor and a single row floorless', () => {
	stubEngine(true);
	const ta = stubTextarea(3);
	const action = autoresize(/** @type {any} */ (ta.node), '');
	ta.node.style.minHeight = '40px';
	ta.input();
	assert.equal(ta.node.style.minHeight, '78px', 'dragging below the rows floor clamps to it');
	ta.node.style.minHeight = '120px';
	ta.input();
	assert.equal(ta.node.style.minHeight, '120px');
	ta.node.rows = 8;
	action.update();
	assert.equal(ta.node.style.minHeight, '178px', 'a rows change re-derives the floor');
	action.destroy();
	const one = stubTextarea(1);
	autoresize(/** @type {any} */ (one.node), '').destroy();
	assert.equal(one.node.style.minHeight, '');
});

test('without field-sizing the script path still measures and sets the height', () => {
	stubEngine(false);
	assert.equal(fieldSizingSupported(), false);
	const ta = stubTextarea(1);
	const action = autoresize(/** @type {any} */ (ta.node), '');
	assert.equal(ta.props['field-sizing'], undefined);
	assert.equal(ta.node.style.height, '56px');
	assert.ok(ta.measured() > 0);
	action.destroy();
	// @ts-expect-error cleanup
	delete globalThis.CSS;
	assert.equal(fieldSizingSupported(), false, 'SSR / no CSS global is unsupported');
});

const feedSrc = await readFile(new URL('../src/lib/components/organisms/ConversationFeed.svelte', import.meta.url), 'utf8');

test('feed entries past the newest eight skip rendering while off screen', () => {
	const code = (compile(feedSrc, { filename: 'ConversationFeed.svelte', css: 'external' }).css?.code ?? '').replace(/\.svelte-[\w-]+/g, '');
	assert.match(code, /\.feed-items > :not\(:nth-last-child\(-n \+ 8\)\) \{\s*content-visibility: auto;\s*contain-intrinsic-block-size: auto 6rem;\s*\}/);
});

test('the feed selector leaves the newest eight entries out of content-visibility', async () => {
	const bundle = await buildFixture('mount-feed-entries.js');
	const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const win = dom.window;
	win.HTMLElement.prototype.scrollTo = () => {};
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	mount(Fixture, { target: win.document.body, props: { count: 12 } });
	flushSync();
	const skipped = [...win.document.querySelectorAll('.feed-items > :not(:nth-last-child(-n + 8))')].map((el) => el.getAttribute('data-id'));
	assert.deepEqual(skipped, ['0', '1', '2', '3']);
	assert.equal(win.document.querySelectorAll('.feed-items > .entry').length, 12);
});
