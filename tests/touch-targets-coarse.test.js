import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalize, rule } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [checkbox, button, table] = await Promise.all(
	['components/atoms/Checkbox.svelte', 'components/atoms/Button.svelte', 'components/organisms/DataTable.svelte'].map(
		read
	)
);

/** Coarse-pointer media blocks of a component's <style>, concatenated. */
function coarse(/** @type {string} */ src) {
	const css = src.slice(src.indexOf('<style>'));
	let out = '';
	for (let i = css.indexOf('@media (pointer: coarse)'); i > -1; i = css.indexOf('@media (pointer: coarse)', i + 1)) {
		let depth = 0;
		let j = css.indexOf('{', i);
		const start = j + 1;
		for (; j < css.length; j++) {
			if (css[j] === '{') depth++;
			else if (css[j] === '}' && --depth === 0) break;
		}
		out += `\n${css.slice(start, j)}`;
	}
	return out;
}

/** Everything in <style> outside the coarse-pointer blocks. */
function fine(/** @type {string} */ src) {
	const css = src.slice(src.indexOf('<style>'));
	return css.replace(/@media \(pointer: coarse\)\s*{[\s\S]*?\n\t}\n/g, '');
}

for (const [name, src, sel] of /** @type {const} */ ([
	['Checkbox', checkbox, '.checkbox'],
	['Button link', button, '.btn-link:not(.hit-compact)']
])) {
	test(`${name}: coarse pointers get a --touch-slab with no inline-end overflow`, () => {
		const block = coarse(src);
		assert.equal(rule(block, sel).position, 'relative');
		const before = rule(block, `${sel}::before`);
		assert.equal(before.content, "''");
		assert.equal(before.position, 'absolute');
		assert.equal(before.inset, undefined, 'a shorthand inset grows the slab past the inline end');
		assert.equal(before['inset-inline'], undefined);
		assert.equal(before['inset-block'], 'var(--touch-slab)');
		assert.equal(before['inset-inline-start'], 'var(--touch-slab)');
		assert.equal(before['inset-inline-end'], '0');
		assert.equal(before['min-height'], undefined, 'the slab never grows the control');
	});
}

test('fine pointers keep the dense rendering: no slab, no min-height outside the coarse blocks', () => {
	for (const [src, sel] of /** @type {const} */ ([
		[checkbox, '.checkbox'],
		[button, '.btn-link'],
		[table, '.dt-sort']
	])) {
		const f = fine(src);
		assert.ok(!f.includes(`${sel}::before`), `${sel}::before only exists under (pointer: coarse)`);
		assert.notEqual(rule(f, sel).position, 'relative');
	}
	assert.equal(rule(fine(table), '.dt-sort').padding, '0');
	assert.equal(rule(fine(button), '.btn-link')['min-height'], 'auto');
});

test('Button link honours hitArea="compact" and leaves the sm text-button rule untouched', () => {
	const block = coarse(button);
	assert.match(block, /\.btn-link:not\(\.hit-compact\) {\s*position: relative;/);
	assert.ok(!/\.btn-sm[^{]*,\s*\.btn-link/.test(block), 'sm and link slabs are separate rules');
});

test('DataTable: the whole-cell sort overlay reaches the compact target vertically, never sideways', () => {
	const block = coarse(table);
	assert.notEqual(rule(block, '.dt-sort').position, 'relative', 'the overlay resolves against the th');
	assert.ok(!block.includes('.dt-sort::before'));
	const after = rule(block, '.dt-sort::after');
	assert.equal(after['inset-block'], 'min(0px, calc((100% - var(--touch-target-compact)) / 2))');
	assert.equal(after['inset-inline'], undefined);
	assert.equal(rule(fine(table), '.dt-sort::after').inset, '0');
});
