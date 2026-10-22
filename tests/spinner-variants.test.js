import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl, normalize } from './helpers.mjs';

const read = (/** @type {string} */ f) => readFile(new URL(`../src/lib/components/atoms/${f}`, import.meta.url), 'utf8');
const spinner = await read('Spinner.svelte');
const skeleton = await read('Skeleton.svelte');
const progress = await read('Progress.svelte');
const spinnerCss = spinner.slice(spinner.indexOf('<style>'));
const skeletonCss = skeleton.slice(skeleton.indexOf('<style>'));
const progressCss = progress.slice(progress.indexOf('<style>'));
const bundle = await buildFixture('mount-spinner-fixture.js');

const VARIANTS = /** @type {const} */ ({
	arc: { count: 0, wrap: false },
	dots: { count: 3, wrap: true },
	orbit: { count: 2, wrap: false },
	pulse: { count: 1, wrap: false },
	bars: { count: 4, wrap: true },
	grid: { count: 9, wrap: true },
	clock: { count: 0, wrap: false },
	bounce: { count: 2, wrap: false },
	comet: { count: 1, wrap: false },
	breath: { count: 5, wrap: true },
	morph: { count: 0, wrap: false },
	sweep: { count: 0, wrap: false }
});

/** @param {Record<string, unknown>} props */
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
	const q = (/** @type {string} */ id) => /** @type {HTMLElement} */ (doc.querySelector(`#${id} [data-tsu]`));
	return { doc, byDefault: q('default'), variant: q('variant'), skeleton: q('skeleton'), progress: q('progress') };
}

test('Spinner exposes variant defaulting to icon and keeps the Icon markup for it', () => {
	assert.match(spinner, /variant = 'icon',/);
	assert.match(spinner, /variant\?: SpinnerVariant;/);
	assert.match(
		spinner,
		/export type SpinnerVariant =\s*\| 'icon'\s*\| 'arc'\s*\| 'dots'\s*\| 'orbit'\s*\| 'pulse'\s*\| 'bars'\s*\| 'grid'\s*\| 'clock'\s*\| 'bounce'\s*\| 'comet'\s*\| 'breath'\s*\| 'morph'\s*\| 'sweep';/
	);
	assert.match(spinner, /<Icon name="loader" spin \{size\} \{label\} data-tsu="Spinner" class=\{klass\} style=\{styleProp\} \{\.\.\.rest\} \/>/);
});

test('default Spinner still renders the spinning loader Icon with the same a11y', () => {
	const ui = render();
	const el = ui.byDefault;
	assert.equal(el.tagName.toLowerCase(), 'svg');
	assert.ok(el.classList.contains('icon') && el.classList.contains('spin'));
	assert.equal(el.getAttribute('role'), 'img');
	assert.equal(el.getAttribute('aria-label'), 'Loading');
	assert.equal(el.getAttribute('aria-hidden'), null);
	assert.equal(el.getAttribute('style') ?? '', '');
	assert.ok(el.querySelector('path[d="M21 12a9 9 0 1 1-6.219-8.56"]'));
});

test('variant="icon" is identical to the default', () => {
	const a = render().byDefault.outerHTML;
	const b = render({ variant: 'icon' }).variant.outerHTML;
	assert.equal(a, b);
});

for (const [variant, { count, wrap }] of Object.entries(VARIANTS)) {
	test(`variant=${variant}: span root, class, ${count} parts${wrap ? ' in .in' : ''}, role=img`, () => {
		const el = render({ variant }).variant;
		assert.equal(el.tagName.toLowerCase(), 'span');
		assert.ok(el.classList.contains('spinner'));
		assert.ok(el.classList.contains(`v-${variant}`));
		assert.equal(el.getAttribute('role'), 'img');
		assert.equal(el.getAttribute('aria-label'), 'Loading');
		assert.equal(el.getAttribute('aria-hidden'), null);
		assert.equal(el.querySelector('svg'), null);
		const inner = wrap ? el.querySelector(':scope > .in') : el;
		assert.ok(inner);
		assert.equal(inner.querySelectorAll(':scope > span').length, count);
		assert.equal(el.querySelectorAll('.in').length, wrap ? 1 : 0);
		assert.equal(el.textContent?.trim(), '');
	});

	test(`variant=${variant}: size sets font-size, class/style pass through, label='' hides`, () => {
		const el = render({ variant, size: 24, class: 'extra', style: 'color: red' }).variant;
		assert.equal(el.style.fontSize, '24px');
		assert.equal(el.style.color, 'red');
		assert.ok(el.classList.contains('extra'));
		const hidden = render({ variant, label: '' }).variant;
		assert.equal(hidden.getAttribute('aria-hidden'), 'true');
		assert.equal(hidden.getAttribute('role'), null);
		assert.ok(!hidden.getAttribute('aria-label'));
		const plain = render({ variant }).variant;
		assert.equal(plain.getAttribute('style'), '');
	});
}

test('variant box is 1em, currentColor, with a --spinner-speed multiplier and a stroke token', () => {
	assert.ok(hasDecl(spinnerCss, '.spinner', 'width', '1em'));
	assert.ok(hasDecl(spinnerCss, '.spinner', 'height', '1em'));
	assert.ok(hasDecl(spinnerCss, '.spinner', 'display', 'inline-block'));
	assert.ok(hasDecl(spinnerCss, '.spinner', 'vertical-align', '-0.125em'));
	assert.ok(hasDecl(spinnerCss, '.spinner', 'color', 'inherit'));
	assert.ok(hasDecl(spinnerCss, '.spinner', '--sw', 'max(1.5px, 0.11em)'));
	assert.ok(hasDecl(spinnerCss, '.spinner', '--t', 'calc(1s * var(--spinner-speed, 1))'));
	assert.ok(hasDecl(spinnerCss, '.in', 'position', 'absolute'));
	assert.doesNotMatch(spinnerCss, /var\(--(accent|text|c-)/, 'draws in currentColor only');
	assert.equal((spinnerCss.match(/background: currentColor;/g) ?? []).length, 14);
	assert.equal((spinnerCss.match(/solid currentColor;/g) ?? []).length, 3);
	assert.match(spinnerCss, /@property --tsu-spin-arc\s*{\s*syntax: '<angle>';\s*inherits: false;\s*initial-value: 100deg;/);
});

test('every variant has keyframes and a static pose under reduced motion', () => {
	for (const k of ['arc', 'rot', 'dot', 'orbit', 'core', 'ripple', 'bar', 'cell', 'hand-m', 'hand-h', 'ball', 'shadow', 'comet', 'sweep', 'morph', 'breath']) {
		assert.match(spinnerCss, new RegExp(`@keyframes tsu-spin-${k}\\s*{`), `tsu-spin-${k}`);
	}
	assert.match(normalize(spinnerCss), /\.v-arc::after { --tsu-spin-arc: 100deg;/);
	assert.ok(hasDecl(spinnerCss, '.v-dots .in span:nth-child(2)', 'opacity', '0.6'));
	assert.ok(hasDecl(spinnerCss, '.v-dots .in span:nth-child(3)', 'opacity', '0.32'));
	assert.ok(hasDecl(spinnerCss, '.v-orbit > span:nth-child(2)', 'transform', 'rotate(45deg)'));
	assert.ok(hasDecl(spinnerCss, '.v-pulse::before,\n\t.v-pulse::after', 'transform', 'scale(0.72)'));
	assert.ok(hasDecl(spinnerCss, '.v-bars .in span:nth-child(1)', 'transform', 'scaleY(0.4)'));
	assert.ok(hasDecl(spinnerCss, '.v-bars .in span:nth-child(4)', 'transform', 'scaleY(1)'));
	assert.ok(hasDecl(spinnerCss, '.v-grid .in span', 'opacity', 'calc(1 - var(--d) * 0.18)'));
	assert.match(normalize(spinnerCss), /\.v-clock::before { height: 0\.32em; transform: rotate\(0deg\);/);
	assert.match(normalize(spinnerCss), /\.v-clock::after { height: 0\.22em; transform: rotate\(90deg\);/);
	assert.ok(hasDecl(spinnerCss, '.v-bounce > span:nth-child(2)', 'opacity', '0.3'));
	assert.match(
		normalize(spinnerCss),
		/@media \(prefers-reduced-motion: reduce\) { \.spinner\.spinner, \.spinner\.spinner span, \.spinner\.spinner::before, \.spinner\.spinner::after { animation: none; } }/
	);
});

test('Skeleton tints from --text (token-overridable) and sweeps once, viewport-anchored, in sync', () => {
	assert.ok(hasDecl(skeletonCss, '.skeleton-bar', '--sk-base', 'var(--skeleton, color-mix(in srgb, var(--text) 7%, transparent))'));
	assert.ok(hasDecl(skeletonCss, '.skeleton-bar', '--sk-hi', 'var(--skeleton-highlight, color-mix(in srgb, var(--text) 13%, transparent))'));
	assert.ok(hasDecl(skeletonCss, '.skeleton-bar', 'background-size', '200vw 100%'));
	assert.ok(hasDecl(skeletonCss, '.skeleton-bar', 'background-attachment', 'fixed'));
	assert.ok(hasDecl(skeletonCss, '.skeleton-bar', 'animation', 'tsu-shimmer 1.8s linear infinite'));
	assert.match(normalize(skeletonCss), /@keyframes tsu-shimmer { 0% { background-position: 100% 0; } 75%, 100% { background-position: 0% 0; } }/);
	assert.match(normalize(skeletonCss), /@media \(prefers-reduced-motion: reduce\) { \.skeleton-bar { animation: none; background: var\(--sk-base\); } }/);
	assert.doesNotMatch(skeletonCss, /--bg-elevated/);
	const el = render().skeleton;
	assert.equal(el.querySelectorAll('.skeleton-bar').length, 2);
	assert.equal(el.getAttribute('aria-hidden'), 'true');
});

test('indeterminate Progress travels edge to edge and fades to a full bar under reduced motion', () => {
	assert.ok(hasDecl(progressCss, '.progress.indeterminate .bar', 'width', '40%'));
	assert.ok(hasDecl(progressCss, '.progress.indeterminate .bar', 'animation', 'kt-progress-slide 1.3s cubic-bezier(0.65, 0, 0.35, 1) infinite'));
	assert.match(normalize(progressCss), /\.progress\.striped\.indeterminate \.bar { animation: kt-progress-slide 1\.3s cubic-bezier\(0\.65, 0, 0\.35, 1\) infinite, kt-stripe 0\.6s linear infinite; }/);
	assert.match(normalize(progressCss), /@keyframes kt-progress-slide { 0% { transform: translateX\(-100%\); } 100% { transform: translateX\(250%\); } }/);
	assert.match(
		normalize(progressCss),
		/@media \(prefers-reduced-motion: reduce\) { \.progress\.indeterminate \.bar, \.progress\.striped \.bar, \.progress\.striped\.indeterminate \.bar { animation: none; } \.progress\.indeterminate \.bar { width: 100%; opacity: 0\.35; } }/
	);
	const el = render().progress;
	assert.ok(el.classList.contains('indeterminate'));
	assert.equal(el.getAttribute('role'), 'progressbar');
	assert.equal(el.getAttribute('aria-valuenow'), null);
	assert.equal(/** @type {HTMLElement} */ (el.querySelector('.bar')).getAttribute('style'), null);
});
