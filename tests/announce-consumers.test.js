import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

/** @param {string} name */
const read = (name) => readFile(new URL(`../src/lib/components/molecules/${name}.svelte`, import.meta.url), 'utf8');
const [copyButton, workingDir] = await Promise.all([read('CopyButton'), read('WorkingDir')]);
const bundle = await buildFixture('mount-announce-consumers.js');
const wait = (/** @type {number} */ ms) => new Promise((r) => setTimeout(r, ms));

/** @param {boolean} [clipboardOk] */
function boot(clipboardOk = true) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const win = /** @type {any} */ (dom.window);
	Object.defineProperty(win.navigator, 'clipboard', {
		value: { writeText: () => (clipboardOk ? Promise.resolve() : Promise.reject(new Error('denied'))) }
	});
	win.document.execCommand = () => false;
	win.eval(bundle);
	const f = win.__fixture;
	const doc = /** @type {Document} */ (win.document);
	const region = () => doc.querySelector('[data-tsu="Announcer"]');
	/** @param {unknown} Component @param {Record<string, unknown>} props */
	const render = (Component, props) => {
		const host = doc.createElement('div');
		doc.body.append(host);
		f.mount(Component, { target: host, props });
		f.flushSync();
		return host;
	};
	return { f, doc, region, render };
}

test('CopyButton and WorkingDir import the shared announce() and render no live region of their own', () => {
	for (const [name, src] of /** @type {const} */ ([['CopyButton', copyButton], ['WorkingDir', workingDir]])) {
		assert.match(src, /import \{ announce \} from '\$lib\/announce';/, name);
		assert.match(src, /announce\(ok \? copiedLabel : 'Copy failed'\);/, name);
		assert.doesNotMatch(src, /aria-live|role="status"/, name);
	}
	const { f, render } = boot();
	assert.equal(render(f.CopyButton, { text: 'x' }).querySelector('[aria-live], [role="status"]'), null);
	assert.equal(render(f.WorkingDir, { path: '/a/b', copy: true, full: true }).querySelector('[aria-live], [role="status"]'), null);
});

test('CopyButton announces the copied label, then the failure text, through one shared region', async () => {
	const ok = boot(true);
	const host = ok.render(ok.f.CopyButton, { text: 'hello', copiedLabel: 'Copied!', sound: false });
	assert.equal(ok.region(), null, 'nothing is announced before a copy');
	/** @type {HTMLButtonElement} */ (host.querySelector('button')).click();
	await wait(150);
	assert.equal(ok.region()?.textContent, 'Copied!');
	assert.equal(ok.region()?.getAttribute('aria-live'), 'polite');

	const bad = boot(false);
	const failing = bad.render(bad.f.CopyButton, { text: 'hello', sound: false });
	/** @type {HTMLButtonElement} */ (failing.querySelector('button')).click();
	await wait(150);
	assert.equal(bad.region()?.textContent, 'Copy failed');
});

test('WorkingDir copy announces through the shared region, shared with CopyButton', async () => {
	const ui = boot(true);
	const chip = ui.render(ui.f.WorkingDir, { path: '/home/me/src', copy: true, full: true, copiedLabel: 'Path copied' });
	const copy = ui.render(ui.f.CopyButton, { text: 'x', sound: false });
	/** @type {HTMLButtonElement} */ (chip.querySelector('button')).click();
	await wait(150);
	assert.equal(ui.region()?.textContent, 'Path copied');
	/** @type {HTMLButtonElement} */ (copy.querySelector('button')).click();
	await wait(150);
	assert.equal(ui.region()?.textContent, 'Copied');
	assert.equal(ui.doc.querySelectorAll('[aria-live]').length, 1, 'one live region for the whole page');
});
