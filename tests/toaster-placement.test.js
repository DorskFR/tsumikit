import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';

const src = await readFile(new URL('../src/lib/components/molecules/Toaster.svelte', import.meta.url), 'utf8');
const css = src.slice(src.indexOf('<style>'));
const bundle = await buildFixture('mount-toaster-focus.svelte.js');

/** @param {Record<string, unknown>} props */
function stack(props) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
	dom.window.eval(bundle);
	const { mount, flushSync, Toaster } = dom.window.__fixture;
	mount(Toaster, { target: dom.window.document.body, props });
	flushSync();
	return /** @type {HTMLElement} */ (dom.window.document.querySelector('[data-tsu="Toaster"]'));
}

test('bottom placements clear the safe area, TabBar, selection bar and --toaster-offset', () => {
	const bottom = css.match(/\.toaster {[^}]*?bottom: (calc\([^;]+\));/s)?.[1].replace(/\s+/g, ' ');
	assert.equal(
		bottom,
		'calc( var(--safe-bottom) + var(--tabbar-h, 0px) + var(--selectionbar-h, 0px) + var(--toaster-offset, 0px) + var(--sp-4) )'
	);
});

test('placement prop defaults to bottom and lands on the stack as data-placement', () => {
	assert.match(src, /placement = 'bottom',/);
	assert.match(src, /placement\?: 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'top';/);
	assert.match(src, /data-tsu="Toaster"\s+data-placement={placement}\s+data-position={side}/);
});

test('position picks the side: left and right drop the centring transform, on either edge', () => {
	assert.match(src, /position\?: 'left' \| 'center' \| 'right';/);
	assert.match(
		src,
		/const side = \$derived\(\s*position \?\? \(placement === 'bottom-start' \? 'left' : placement === 'bottom-end' \? 'right' : 'center'\)\s*\);/
	);
	assert.ok(hasDecl(css, ".toaster[data-position='left']", 'left', 'calc(var(--safe-left) + var(--sp-4))'));
	assert.ok(hasDecl(css, ".toaster[data-position='left']", 'transform', 'none'));
	assert.ok(hasDecl(css, ".toaster[data-position='right']", 'left', 'auto'));
	assert.ok(hasDecl(css, ".toaster[data-position='right']", 'right', 'calc(var(--safe-right) + var(--sp-4))'));
	assert.ok(hasDecl(css, ".toaster[data-position='right']", 'transform', 'none'));
	assert.doesNotMatch(css, /data-placement='bottom-(start|end)'/);
});

test('the top placement moves the stack to the top edge', () => {
	assert.ok(hasDecl(css, ".toaster[data-placement='top']", 'bottom', 'auto'));
	assert.ok(hasDecl(css, ".toaster[data-placement='top']", 'top', /var\(--safe-top\)/));
});

test('the stack lets taps through; only the toast cards take pointer events', () => {
	assert.ok(hasDecl(css, '.toaster', 'pointer-events', 'none'));
	assert.ok(hasDecl(css, '.toaster :global(.toast)', 'pointer-events', 'auto'));
});

test('position lands on the stack as data-position, defaulting to the side placement names', () => {
	assert.equal(stack({}).dataset.position, 'center');
	assert.equal(stack({ placement: 'bottom-start' }).dataset.position, 'left');
	assert.equal(stack({ placement: 'bottom-end' }).dataset.position, 'right');
	assert.equal(stack({ position: 'left' }).dataset.position, 'left');
	assert.equal(stack({ position: 'right' }).dataset.position, 'right');
	const topRight = stack({ placement: 'top', position: 'right' });
	assert.equal(topRight.dataset.placement, 'top');
	assert.equal(topRight.dataset.position, 'right');
	assert.equal(stack({ placement: 'bottom-end', position: 'center' }).dataset.position, 'center');
});
