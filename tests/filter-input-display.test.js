import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';

const source = await readFile(
	new URL('../src/lib/components/molecules/FilterInput.svelte', import.meta.url),
	'utf8'
);
const bundle = await buildFixture();

const TABBABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Mount the fixture form in a fresh jsdom document.
 * @param {{ value?: string, withDisplay?: boolean }} props
 */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	mount(Fixture, { target: dom.window.document.body, props });
	flushSync();
	const doc = dom.window.document;
	const input = /** @type {HTMLInputElement} */ (doc.querySelector('input.fi__input'));
	return {
		doc,
		win: dom.window,
		input,
		flush: flushSync,
		display: () => doc.querySelector('.fi__display'),
		masked: () => input.classList.contains('fi__input--masked')
	};
}

test('the display snippet renders over the input while blurred and non-empty', () => {
	const ui = render({ value: '/home/dorsk/Documents/tsumikit' });
	assert.equal(ui.display()?.textContent?.trim(), 'tsumikit');
	assert.equal(ui.input.value, '/home/dorsk/Documents/tsumikit');
	assert.equal(ui.masked(), true);
	assert.equal(ui.display()?.getAttribute('aria-hidden'), 'true');
});

test('focusing reveals the raw value, blurring re-renders the snippet', () => {
	const ui = render({ value: '/srv/media library' });
	assert.equal(ui.display()?.textContent?.trim(), 'media library');

	ui.input.focus();
	ui.flush();
	assert.equal(ui.display(), null);
	assert.equal(ui.masked(), false);
	assert.equal(ui.input.value, '/srv/media library');

	ui.input.blur();
	ui.flush();
	assert.equal(ui.display()?.textContent?.trim(), 'media library');
	assert.equal(ui.masked(), true);
});

test('the snippet re-renders from the edited value on blur', () => {
	const ui = render({ value: '/srv/app' });
	ui.input.focus();
	ui.flush();
	ui.input.value = '/srv/other';
	ui.input.dispatchEvent(new ui.win.Event('input', { bubbles: true }));
	ui.flush();
	ui.input.blur();
	ui.flush();
	assert.equal(ui.display()?.textContent?.trim(), 'other');
});

test('an empty field shows no display, so the placeholder survives', () => {
	const ui = render({ value: '' });
	assert.equal(ui.display(), null);
	assert.equal(ui.masked(), false);
});

test('the display adds no tab stop: the field is still a single one', () => {
	const withDisplay = render({ value: '/home/dorsk/Documents/tsumikit' });
	const without = render({ value: '/home/dorsk/Documents/tsumikit', withDisplay: false });

	const stops = (/** @type {{ doc: Document }} */ ui) => [...ui.doc.querySelectorAll(TABBABLE)];
	const inBar = (/** @type {{ doc: Document }} */ ui) =>
		stops(ui).filter((el) => el.closest('[data-tsu="FilterInput"]'));

	assert.deepEqual(
		stops(withDisplay).map((el) => el.id || el.className),
		['before', 'cwd', 'after']
	);
	assert.equal(inBar(withDisplay).length, 1);
	assert.equal(inBar(withDisplay).length, inBar(without).length);
	assert.equal(withDisplay.display()?.querySelectorAll(TABBABLE).length, 0);
	assert.equal(withDisplay.display()?.hasAttribute('tabindex'), false);
});

test('the overlay occupies the input box without taking it out of the flow', () => {
	assert.equal(hasDecl(source, '.fi__display', 'position', 'absolute'), true);
	assert.equal(hasDecl(source, '.fi__display', 'inset', '0'), true);
	assert.equal(hasDecl(source, '.fi__display', 'pointer-events', 'none'), true);
	assert.equal(hasDecl(source, '.fi__display', 'overflow', 'hidden'), true);
	assert.equal(hasDecl(source, '.fi__field', 'position', 'relative'), true);
	assert.equal(hasDecl(source, '.fi__field', 'flex', '1'), true);
	assert.equal(hasDecl(source, '.fi__field', 'min-width', '0'), true);
	assert.equal(hasDecl(source, '.fi__input--masked', 'color', 'transparent'), true);
	// The mask must win over `.fi__input { color: var(--text) }`, same specificity.
	assert.ok(source.indexOf('.fi__input--masked') > source.indexOf('.fi__input {'));
});

test('display is an optional snippet taking the shared parse context', () => {
	assert.match(source, /display\?: Snippet<\[FilterInputContext\]>/);
	assert.match(source, /const showDisplay = \$derived\(!!display && !focused && !!value\);/);
	assert.match(source, /{@render display\(ctx\)}/);
});
