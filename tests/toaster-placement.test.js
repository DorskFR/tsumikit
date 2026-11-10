import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { hasDecl } from './helpers.mjs';

const src = await readFile(new URL('../src/lib/components/molecules/Toaster.svelte', import.meta.url), 'utf8');
const css = src.slice(src.indexOf('<style>'));

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
	assert.match(src, /data-tsu="Toaster" data-placement={placement}/);
});

test('start/end/top placements reposition without the centring transform', () => {
	assert.ok(hasDecl(css, ".toaster[data-placement='bottom-start']", 'transform', 'none'));
	assert.ok(hasDecl(css, ".toaster[data-placement='bottom-end']", 'transform', 'none'));
	assert.ok(hasDecl(css, ".toaster[data-placement='bottom-end']", 'right', 'calc(var(--safe-right) + var(--sp-4))'));
	assert.ok(hasDecl(css, ".toaster[data-placement='top']", 'bottom', 'auto'));
	assert.ok(hasDecl(css, ".toaster[data-placement='top']", 'top', /var\(--safe-top\)/));
});

test('the stack lets taps through; only the toast cards take pointer events', () => {
	assert.ok(hasDecl(css, '.toaster', 'pointer-events', 'none'));
	assert.ok(hasDecl(css, '.toaster :global(.toast)', 'pointer-events', 'auto'));
});
