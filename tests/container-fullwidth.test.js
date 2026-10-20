import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { compile } from 'svelte/compiler';
import { buildFixture } from './fixtures/build.mjs';

const source = await readFile(
	new URL('../src/lib/components/layouts/Container.svelte', import.meta.url),
	'utf8'
);
const css = compile(source, { filename: 'Container.svelte', css: 'external' }).css?.code.replace(/\s+/g, ' ') ?? '';
const bundle = await buildFixture('mount-container.svelte.js');

/** @param {Record<string, unknown>} init @param {{ inner?: number, client?: number }} viewport */
function render(init, { inner = 1280, client = 1265 } = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		url: 'https://app.test/',
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const win = dom.window;
	let clientWidth = client;
	Object.defineProperty(win, 'innerWidth', { configurable: true, get: () => inner });
	Object.defineProperty(win.document.documentElement, 'clientWidth', { configurable: true, get: () => clientWidth });
	win.eval(bundle);
	const { mount, flushSync, Fixture, props } = win.__fixture;
	const live = props(init);
	mount(Fixture, { target: win.document.body, props: live });
	flushSync();
	const el = () => /** @type {HTMLElement} */ (win.document.querySelector('[data-tsu="Container"]'));
	const resize = (/** @type {number} */ next) => {
		clientWidth = next;
		win.dispatchEvent(new win.Event('resize'));
		flushSync();
	};
	return { el, resize, props: live, flush: flushSync };
}

test('fullWidth subtracts the measured scrollbar gutter from 100vw', () => {
	assert.match(css, /\.ct\.full\.svelte-[\w-]+ \{[^}]*--ct-vw: calc\(100vw - var\(--ct-scrollbar, 0px\)\);/);
	assert.match(css, /width: calc\(var\(--ct-vw\) - var\(--ct-inset-l\) - var\(--ct-inset-r\)\);/);
	assert.match(
		css,
		/margin-inline: calc\(50% - var\(--ct-vw\) \/ 2 \+ var\(--ct-inset-l\)\) calc\(50% - var\(--ct-vw\) \/ 2 \+ var\(--ct-inset-r\)\);/
	);
	assert.doesNotMatch(css, /width: calc\(100vw - var\(--ct-inset-l\)/);
});

test('fullWidth publishes --ct-scrollbar and tracks it on resize', () => {
	const r = render({ fullWidth: true, inset: '1rem 2rem' });
	assert.match(r.el().getAttribute('style') ?? '', /--ct-scrollbar: 15px/);
	assert.match(r.el().getAttribute('style') ?? '', /--ct-inset-l: 1rem; --ct-inset-r: 2rem/);
	r.resize(1280);
	assert.doesNotMatch(r.el().getAttribute('style') ?? '', /--ct-scrollbar/);
});

test('without fullWidth no gutter variable or listener is added', () => {
	const r = render({ fullWidth: false });
	assert.equal(r.el().getAttribute('style'), null);
	r.props.fullWidth = true;
	r.flush();
	assert.match(r.el().getAttribute('style') ?? '', /--ct-scrollbar: 15px/);
});
