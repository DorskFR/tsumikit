import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { hasDecl, readDocs, rule } from './helpers.mjs';
import { readDemo } from './helpers/demo-source.js';

/** @param {string} p */
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
const [checkbox, switchSrc, readme, page] = await Promise.all([
	read('../src/lib/components/atoms/Checkbox.svelte'),
	read('../src/lib/components/atoms/Switch.svelte'),
	readDocs('components.md'),
	readDemo()
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

test('the box scales per size class and the default sits on the 4px chip grid (TSU-170)', () => {
	assert.ok(hasDecl(checkbox, '.box', 'width', 'var(--chip-sm)'));
	assert.ok(hasDecl(checkbox, '.box', 'height', 'var(--chip-sm)'));
	assert.ok(hasDecl(checkbox, '.fx', 'font-size', 'var(--chip-sm)'));
	for (const [cls, chip] of [['checkbox-sm', 'var(--chip-xs)'], ['checkbox-lg', 'var(--chip-md)']]) {
		assert.ok(hasDecl(checkbox, `.${cls} .box`, 'width', chip));
		assert.ok(hasDecl(checkbox, `.${cls} .box`, 'height', chip));
		assert.ok(hasDecl(checkbox, `.${cls} .fx`, 'font-size', chip));
	}
	assert.doesNotMatch(checkbox, /--cb-box/);
	assert.equal((checkbox.match(/1\.15rem/g) ?? []).length, 0);
	const sm = rule(checkbox, '.checkbox-sm');
	assert.equal(sm['font-size'], 'var(--fs-xs)');
	const lg = rule(checkbox, '.checkbox-lg');
	assert.equal(lg['font-size'], 'var(--fs-base)');
	assert.ok(hasDecl(checkbox, '.checkbox', 'font-size', 'var(--fs-sm)'));
});

test('Checkbox size mirrors Switch so a checkbox and a switch match in one row (TSU-170)', () => {
	assert.ok(hasDecl(switchSrc, '.switch-row', 'font-size', 'var(--fs-sm)'));
	assert.ok(hasDecl(switchSrc, '.switch-row-sm', 'font-size', 'var(--fs-xs)'));
	assert.ok(hasDecl(checkbox, '.checkbox-sm', 'font-size', 'var(--fs-xs)'));
});

test('the size prop is documented and shown in the catalog (TSU-170)', () => {
	assert.match(readme, /Checkbox \(`size`/);
	assert.match(page, /<Checkbox[^>]*size="sm"/s);
});
