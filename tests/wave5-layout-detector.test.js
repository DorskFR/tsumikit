import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} p */
const read = (p) => readFile(new URL(`../src/lib/components/${p}`, import.meta.url), 'utf8');
/** @param {string} src */
const css = (src) => src.slice(src.indexOf('<style>'));
/** @param {string} sheet @param {string} selector */
const rule = (sheet, selector) => {
	const m = sheet.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
	assert.ok(m, `missing rule ${selector}`);
	return m[1];
};

test('Truncate fit caps its budget below a spilling candidate so the candidate never overruns the rail', async () => {
	const src = await read('molecules/Truncate.svelte');
	assert.match(src, /const budget = Math\.max\(0, Math\.min\(avail - 1, cap\)\);/);
	assert.match(src, /const over = el\.scrollWidth - el\.clientWidth;/);
	assert.match(src, /if \(over > 0\) cap = Math\.min\(untrack\(\(\) => cap\), \[\.\.\.shown\]\.length \* chPx - over\);/);
	assert.match(src, /if \(w > avail\) cap = Number\.POSITIVE_INFINITY;/);
});

test('Truncate focus ring stays inside the clipping rail', async () => {
	const sheet = css(await read('molecules/Truncate.svelte'));
	assert.match(rule(sheet, '.rail .trunc:focus-visible'), /outline-offset:\s*var\(--focus-ring-offset-inset\)/);
	assert.match(rule(sheet, '.rail'), /overflow:\s*hidden/);
});

test('NavBar stacked labels are capped to the link so the ellipsis applies', async () => {
	const sheet = css(await read('layouts/NavBar.svelte'));
	assert.match(rule(sheet, '.stacked .navbar-label'), /max-width:\s*100%/);
	assert.match(rule(sheet, '.navbar-label'), /text-overflow:\s*ellipsis/);
});

test('AppShell menu button never shrinks below the IconButton', async () => {
	const sheet = css(await read('layouts/AppShell.svelte'));
	assert.match(rule(sheet, '.shell-menu-btn'), /flex:\s*none/);
});
