import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { hasDecl, rule } from './helpers.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
const [checkbox, switchSrc, readme, page] = await Promise.all([
	read('../src/lib/components/atoms/Checkbox.svelte'),
	read('../src/lib/components/atoms/Switch.svelte'),
	read('../README.md'),
	read('../src/routes/+page.svelte')
]);

test('Checkbox takes the shared ControlSize union, defaulting to md (TSU-170)', () => {
	assert.match(checkbox, /import type { ControlSize } from '\$lib\/size'/);
	assert.match(checkbox, /size\?: ControlSize;/);
	assert.match(checkbox, /size = 'md',/);
	assert.match(checkbox, /class:checkbox-sm={size === 'sm'}/);
	assert.match(checkbox, /class:checkbox-lg={size === 'lg'}/);
	// `size` on an <input type=checkbox> is meaningless, so the prop is ours.
	assert.match(checkbox, /Omit<HTMLInputAttributes, 'size'>/);
});

test('the box scales through --cb-box and the 1.15rem default is unchanged (TSU-170)', () => {
	assert.ok(hasDecl(checkbox, '.box', 'width', 'var(--cb-box, 1.15rem)'));
	assert.ok(hasDecl(checkbox, '.box', 'height', 'var(--cb-box, 1.15rem)'));
	// No hard-coded 1.15rem anywhere else: the fallback is the single default.
	assert.equal((checkbox.match(/1\.15rem/g) ?? []).length, 2);
	const sm = rule(checkbox, '.checkbox-sm');
	assert.equal(sm['--cb-box'], '0.95rem');
	assert.equal(sm['font-size'], 'var(--fs-xs)');
	const lg = rule(checkbox, '.checkbox-lg');
	assert.equal(lg['--cb-box'], '1.35rem');
	assert.equal(lg['font-size'], 'var(--fs-base)');
	assert.ok(hasDecl(checkbox, '.checkbox', 'font-size', 'var(--fs-sm)'));
});

test('Checkbox size mirrors Switch so a checkbox and a switch match in one row (TSU-170)', () => {
	assert.ok(hasDecl(switchSrc, '.switch-row', 'font-size', 'var(--fs-sm)'));
	assert.ok(hasDecl(switchSrc, '.switch-row-sm', 'font-size', 'var(--fs-xs)'));
	assert.ok(hasDecl(checkbox, '.checkbox-sm', 'font-size', 'var(--fs-xs)'));
});

test('the size prop and --cb-box are documented and shown in the catalog (TSU-170)', () => {
	assert.match(readme, /--cb-box/);
	assert.match(readme, /Checkbox \(`size`/);
	assert.match(page, /<Checkbox[^>]*size="sm"/s);
});
