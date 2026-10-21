import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalize, rule } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [tokens, button, seg, toggle, sw, link, input] = await Promise.all(
	[
		'styles/tokens.css',
		'components/atoms/Button.svelte',
		'components/molecules/SegmentedControl.svelte',
		'components/molecules/Toggle.svelte',
		'components/atoms/Switch.svelte',
		'components/atoms/Link.svelte',
		'components/atoms/Input.svelte'
	].map(read)
);

const compact = Number(tokens.match(/--touch-target-compact:\s*(\d+)px/)?.[1]);
const slabExpr = normalize(tokens.match(/--touch-slab:\s*([^;]+);/)?.[1] ?? '').trim();

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

/** Resolve `--touch-slab` for a box of `px` pixels. */
function slabAt(/** @type {number} */ px) {
	const m = slabExpr.match(/^min\(-(\d+)px, calc\(\(100% - var\(--touch-target-compact\)\) \/ 2\)\)$/);
	assert.ok(m, `unexpected --touch-slab shape: ${slabExpr}`);
	return Math.min(-Number(m[1]), (px - compact) / 2);
}

test('tokens: --touch-slab is a centred slab, >= 8px past each edge and >= the compact target', () => {
	assert.equal(compact, 40);
	for (const box of [16, 20, 24, 28, 32, 40, 48, 120]) {
		const inset = slabAt(box);
		assert.ok(inset <= -8, `at least 8px past each edge (box ${box}px)`);
		assert.ok(box - 2 * inset >= compact, `hit size >= ${compact}px (box ${box}px)`);
	}
	assert.equal(24 - 2 * slabAt(24), 40);
	assert.equal(32 - 2 * slabAt(32), 48);
});

for (const [name, src, sel] of /** @type {const} */ ([
	['Toggle', toggle, '.toggle'],
	['Switch', sw, '.switch'],
	['Link', link, '.link'],
	[
		'Button sm',
		button,
		'.btn-sm:not(.btn-icon, .btn-icon-inline, .btn-box, .btn-square, .btn-chip, .btn-stacked, .hit-compact)'
	]
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
	});
}

test('in a row of shape-A slabs, each visual centre hits its own control', () => {
	for (const box of [24, 28, 32, 48, 96]) {
		const reach = -slabAt(box);
		for (const gap of [0, 2, 4, 8]) {
			// Later siblings paint, and so hit-test, on top: own box, then its slab.
			const layers = [0, 1, 2].flatMap((i) => {
				const x = i * (box + gap);
				return [
					{ i, from: x, to: x + box },
					{ i, from: x - reach, to: x + box }
				];
			});
			for (const i of [0, 1, 2]) {
				const centre = i * (box + gap) + box / 2;
				const hit = layers.findLast((l) => l.from <= centre && centre <= l.to);
				assert.equal(hit?.i, i, `centre of control ${i} (box ${box}px, gap ${gap}px)`);
			}
		}
	}
});

test('Button: text sm buttons never stack a second slab on the icon/box ::after one', () => {
	const block = coarse(button);
	for (const cls of ['btn-icon', 'btn-icon-inline', 'btn-box', 'btn-square', 'btn-chip', 'btn-stacked', 'hit-compact']) {
		assert.match(block, new RegExp(`\\.btn-sm:not\\([^)]*\\.${cls}[,)]`), `excludes .${cls}`);
	}
});

test('SegmentedControl: items grow on the block axis and only half the gap sideways', () => {
	const block = coarse(seg);
	const before = rule(block, '.seg-item::before');
	assert.equal(before['inset-block'], 'var(--touch-slab)');
	assert.equal(before['inset-inline'], 'calc(var(--sp-1) / -2)');
	assert.equal(before.inset, undefined);
	assert.equal(rule(seg, '.seg').gap, 'var(--sp-1)', 'the half-gap matches the group gap');
	const pad = rule(seg, '.seg').padding === 'var(--sp-0-5)' ? 2 : Number.NaN;
	assert.ok(2 <= pad, 'the edge items reach (half of the 4px gap) stays inside the group padding');
	const gap = 4;
	const reach = gap / 2;
	for (const box of [24, 40, 80]) {
		const aEnd = box + reach;
		const bStart = box + gap - reach;
		assert.ok(aEnd <= bStart, `neighbouring slabs never overlap (box ${box}px)`);
	}
});

test('SegmentedControl: a scrolling strip clips the slab instead of scrolling vertically', () => {
	const s = rule(seg, '.seg-scroll');
	assert.equal(s['overflow-x'], 'auto');
	assert.equal(s['overflow-y'], 'hidden');
});

test('Input sm: coarse pointers grow the box to the compact target (inputs cannot host a slab)', () => {
	const block = coarse(input);
	assert.equal(
		rule(block, '.input-sm:not(.grouped)')['min-height'],
		'max(var(--touch-target-compact), var(--input-size, var(--control-height-compact)))'
	);
	assert.equal(rule(input, '.input-sm')['min-height'], 'var(--input-size, var(--control-height-compact))');
});
