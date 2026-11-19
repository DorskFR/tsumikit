import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { rule } from './helpers.mjs';

const DIR = new URL('../src/lib/looks/', import.meta.url);
const looks = await Promise.all(
	(await readdir(DIR)).filter((f) => f.endsWith('.css')).map(async (f) => ({ f, css: await readFile(new URL(f, DIR), 'utf8') }))
);
const depth = looks.find((l) => l.f === 'depth.css')?.css ?? '';

/**
 * Selectors of the innermost rules whose body reads `var(--pointer-*)`.
 * @param {string} css
 */
function pointerReaders(css) {
	/** @type {string[]} */
	const out = [];
	for (const m of css.matchAll(/([^{};]+)\{([^{}]*)\}/g)) {
		if (/var\(--pointer-[xy]/.test(m[2])) out.push(m[1].trim());
	}
	return out;
}

test('no look resolves the pointer position on a root token block', () => {
	for (const { f, css } of looks) {
		for (const sel of pointerReaders(css)) {
			assert.doesNotMatch(sel, /^(:root(\[[^\]]*\])*,?\s*)+$/, `${f}: ${sel}`);
		}
	}
});

test('the depth spotlight gradients are built on the hovered card itself', () => {
	const on = rule(depth, ':root[data-look="depth"] .card:where(:hover)').background;
	const tap = rule(depth, ':root[data-look="depth"] .card:where(.card-tap:hover)').background;
	assert.match(on, /^radial-gradient\(22rem circle at var\(--pointer-x, -100rem\) var\(--pointer-y, -100rem\), var\(--depth-spot-on-tint\), transparent 70%\) padding-box,/);
	assert.match(tap, /^radial-gradient\(18rem circle at var\(--pointer-x, 50%\) var\(--pointer-y, 0%\), var\(--depth-spot-tap-tint\), transparent 70%\) padding-box,/);
	assert.doesNotMatch(depth, /--depth-spot(-on|-tap)?:/);
	assert.equal((depth.match(/--depth-spot-on-tint: color-mix\(/g) ?? []).length, 2, 'dark and light tints stay tokens');
	assert.equal((depth.match(/--depth-spot-tap-tint: color-mix\(/g) ?? []).length, 2);
});

test('every depth card variant keeps its fill under the pointer spotlight', () => {
	const hovered = [...depth.matchAll(/\.card:where\(([^)]*):hover\) \{([^}]*)\}/g)];
	assert.ok(hovered.length > 20, `${hovered.length} hover rules`);
	for (const [, variant, body] of hovered) {
		const rest = rule(depth, variant.startsWith('.card-tap') ? `:root[data-look="depth"] .card${variant === '.card-tap' ? '' : `:where(${variant.slice('.card-tap'.length)})`}` : `:root[data-look="depth"] .card${variant ? `:where(${variant})` : ''}`).background;
		const layers = (/** @type {string} */ v) => v.replace(/\s+/g, ' ').split(' padding-box').map((l) => l.replace(/^, ?/, '').trim()).filter(Boolean);
		assert.deepEqual(layers(body.slice(body.indexOf(':') + 1).replace(/;\s*$/, '')).slice(1), layers(rest).slice(1), variant || '.card');
	}
});
