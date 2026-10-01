import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { hasDecl, normalize } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [tokens, reset, button, popover, fileButton, resizablePanel] = await Promise.all([
	read('styles/tokens.css'),
	read('styles/reset.css'),
	read('components/atoms/Button.svelte'),
	read('components/molecules/Popover.svelte'),
	read('components/molecules/FileButton.svelte'),
	read('components/layouts/ResizablePanel.svelte')
]);

const touchTarget = Number(tokens.match(/--touch-target:\s*(\d+)px/)?.[1]);

function slab(/** @type {string} */ src) {
	const body = src.match(/::after\s*{([^}]*--touch-target[^}]*)}/)?.[1];
	assert.ok(body, 'no coarse-pointer hit slab found');
	return Object.fromEntries(
		body
			.split(';')
			.map((/** @type {string} */ d) => d.trim())
			.filter(Boolean)
			.map((/** @type {string} */ d) => {
				const i = d.indexOf(':');
				return [d.slice(0, i).trim(), normalize(d.slice(i + 1)).trim()];
			})
	);
}

function inset(/** @type {string} */ expr, /** @type {number} */ boxPx) {
	const resolved = expr.replaceAll('100%', `${boxPx}px`).replaceAll('var(--touch-target)', `${touchTarget}px`);
	const min = resolved.match(/^min\((.*)\)$/s);
	assert.ok(min, `cannot evaluate inset: ${expr}`);
	return Math.min(
		...min[1].split(',').map((arg) => {
			const calc = arg.trim().match(/^calc\((.*)\)$/s);
			const body = (calc ? calc[1] : arg).trim();
			const term = body.match(/^\(?\s*(-?[\d.]+)px(?:\s*([-+])\s*([\d.]+)px)?\s*\)?(?:\s*\/\s*([\d.]+))?$/);
			assert.ok(term, `cannot evaluate inset term: ${arg}`);
			const [, a, op, b, divisor] = term;
			const sum = Number(a) + (b === undefined ? 0 : (op === '-' ? -1 : 1) * Number(b));
			return divisor === undefined ? sum : sum / Number(divisor);
		})
	);
}

const slabs = Object.entries({
	Button: button,
	Popover: popover,
	FileButton: fileButton
});

for (const [name, src] of slabs) {
	test(`${name}: the coarse hit slab adds no inline-end overflow`, () => {
		const decls = slab(src);
		assert.equal(decls.inset, undefined, 'a shorthand `inset` grows the slab past the inline end');
		assert.equal(decls['inset-inline-end'], '0');
		assert.ok(decls['inset-inline-start'], 'the slab must size its inline start explicitly');
		assert.ok(decls['inset-block'], 'the slab must size its block axis explicitly');
	});

	test(`${name}: the coarse hit slab still reaches --touch-target`, () => {
		const decls = slab(src);
		for (const box of [20, 24, 32, 44, 56]) {
			const start = inset(decls['inset-inline-start'], box);
			assert.ok(start <= 0, `inline-start inset must never be positive (box ${box}px)`);
			assert.ok(box - start >= Math.min(touchTarget, box), `hit width too small (box ${box}px)`);
			if (box <= touchTarget) assert.equal(box - start, touchTarget, `hit width at box ${box}px`);

			const blockStart = inset(decls['inset-block'], box);
			assert.ok(blockStart <= 0, `block inset must never be positive (box ${box}px)`);
			if (box <= touchTarget) assert.equal(box - 2 * blockStart, touchTarget, `hit height at box ${box}px`);
		}
	});
}

test('custom scrollbars are scoped to fine pointers so touch keeps overlay bars', () => {
	const scoped = reset.match(/@media \(hover: hover\) and \(pointer: fine\) \{([\s\S]*?)\n\}/)?.[1] ?? '';
	assert.match(scoped, /::-webkit-scrollbar\s*\{/);
	assert.match(scoped, /::-webkit-scrollbar-thumb\s*\{/);
	const unscoped = reset.replace(/@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\n\}/g, '');
	assert.doesNotMatch(unscoped, /::-webkit-scrollbar/);
});

test('ResizablePanel content scrolls vertically only', () => {
	assert.ok(hasDecl(resizablePanel, '.panel-content', 'overflow-y', 'auto'));
	assert.ok(hasDecl(resizablePanel, '.panel-content', 'overflow-x', 'hidden'));
	assert.equal(hasDecl(resizablePanel, '.panel-content', 'overflow'), false);
});
