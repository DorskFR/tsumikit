import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const [source, bundle] = await Promise.all([
	readFile(new URL('../src/lib/components/atoms/Skeleton.svelte', import.meta.url), 'utf8'),
	buildFixture('mount-skeleton.js')
]);

const win = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' }).window;
win.eval(bundle);
win.__fixture.mount(win.__fixture.Fixture, { target: win.document.body });
win.__fixture.flushSync();

/** @param {string} id */
const get = (id) => /** @type {HTMLElement} */ (win.document.querySelector(`[data-testid="${id}"]`));
/** @param {HTMLElement} el */
const bars = (el) => /** @type {HTMLElement[]} */ ([...el.querySelectorAll('.skeleton-bar')]);

test('without height every line is a 1lh line box holding a centred 1em bar, with no gap', () => {
	const el = get('text');
	assert.ok(el.classList.contains('skeleton-text'));
	const lines = [...el.children];
	assert.equal(lines.length, 3);
	for (const line of lines) {
		assert.ok(line.classList.contains('skeleton-line'));
		assert.equal(line.children.length, 1);
		assert.equal(/** @type {HTMLElement} */ (line.firstElementChild).style.height, '1em');
	}
	assert.deepEqual(bars(el).map((b) => b.style.width), ['', '', '60%']);
	assert.match(source, /\.skeleton-line\s*{\s*display: flex;\s*align-items: center;\s*height: 1lh;\s*}/);
	assert.match(source, /\.skeleton-text\s*{\s*gap: 0;\s*}/);
});

test('a single default Skeleton is one line box at the given width', () => {
	const el = get('single');
	assert.equal(el.style.width, '9rem');
	assert.equal(el.querySelectorAll('.skeleton-line').length, 1);
});

test('an explicit height keeps the gapped bars as direct children', () => {
	const el = get('bars');
	assert.equal(el.classList.contains('skeleton-text'), false);
	assert.equal(el.querySelector('.skeleton-line'), null);
	assert.equal(el.children.length, 3);
	for (const bar of bars(el)) {
		assert.equal(bar.parentElement, el);
		assert.equal(bar.style.height, '0.85em');
		assert.equal(bar.style.borderRadius, 'var(--r-sm)');
	}
	assert.equal(bars(el)[2].style.width, '60%');
	assert.match(source, /\.skeleton\s*{[^}]*gap: var\(--sp-2\);/);
});

test('circle keeps a round bar whose width follows its height', () => {
	const el = get('circle');
	assert.equal(el.style.width, '40px');
	assert.equal(el.querySelector('.skeleton-line'), null);
	assert.equal(bars(el)[0].style.height, '40px');
	assert.equal(bars(el)[0].style.borderRadius, '50%');
});

test('aspect renders one block at that aspect-ratio and the given width', () => {
	const el = get('aspect');
	assert.equal(el.style.width, '8rem');
	assert.equal(el.querySelector('.skeleton-line'), null);
	const [bar] = bars(el);
	assert.equal(bar.style.aspectRatio, '2/3');
	assert.equal(bar.style.height, '');
	assert.equal(bar.style.borderRadius, 'var(--r-md)');
});

test('control renders a box at the kit control height and radius', () => {
	const el = get('control');
	assert.equal(el.style.width, '100%');
	const [bar] = bars(el);
	assert.equal(bar.style.height, 'var(--control-height-default)');
	assert.equal(bar.style.borderRadius, 'var(--input-radius, var(--r-md))');
});

test('decorative hooks, variants and an explicit radius are kept', () => {
	for (const id of ['text', 'bars', 'aspect', 'control', 'pulse']) {
		assert.equal(get(id).getAttribute('aria-hidden'), 'true');
		assert.equal(get(id).dataset.tsu, 'Skeleton');
	}
	const pulse = get('pulse');
	assert.ok(pulse.classList.contains('v-pulse'));
	assert.deepEqual(bars(pulse).map((b) => b.style.getPropertyValue('--i')), ['0', '1']);
	assert.equal(bars(pulse)[0].style.borderRadius, 'var(--r-pill)');
	assert.match(source, /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.skeleton-bar\s*{\s*animation: none;/);
});
