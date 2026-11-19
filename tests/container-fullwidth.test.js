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
	assert.match(css, /\.ct\.full\.svelte-[\w-]+ \{[^}]*width: 100vw;[^}]*margin-inline: calc\(50% - 50vw\);/);
	const r = render({ fullWidth: true });
	assert.match(r.el().getAttribute('style') ?? '', /width: calc\([^;]*\(100vw - 15px\)/);
	assert.match(
		r.el().getAttribute('style') ?? '',
		/margin-inline: calc\(50% - \(100vw - 15px\) \/ 2 \+ 0px\) calc\(50% - \(100vw - 15px\) \/ 2 \+ 0px\)/
	);
});

test('fullWidth takes the scrollbar and the insets out inline and tracks the scrollbar on resize', () => {
	const r = render({ fullWidth: true, inset: '1rem 2rem' });
	assert.match(r.el().getAttribute('style') ?? '', /width: calc\(-3rem \+ \(100vw - 15px\)\)/);
	assert.match(r.el().getAttribute('style') ?? '', /\(100vw - 15px\) \/ 2 \+ 1rem\) calc\(50% - \(100vw - 15px\) \/ 2 \+ 2rem\)/);
	r.resize(1280);
	assert.match(r.el().getAttribute('style') ?? '', /width: calc\([^;]*100vw/);
	assert.doesNotMatch(r.el().getAttribute('style') ?? '', /15px/);
	assert.doesNotMatch(r.el().getAttribute('style') ?? '', /--/);
});

test('without fullWidth no gutter variable or listener is added', () => {
	const r = render({ fullWidth: false });
	assert.equal(r.el().getAttribute('style'), null);
	r.props.fullWidth = true;
	r.flush();
	assert.match(r.el().getAttribute('style') ?? '', /100vw - 15px/);
});
