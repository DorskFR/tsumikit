import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { compile } from 'svelte/compiler';

/** @param {string} p */
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');

const reset = await read('../src/lib/styles/reset.css');
const reduce = reset.slice(reset.indexOf('@media (prefers-reduced-motion: reduce)'));

test('the global reset flattens every animation and limits transitions to colour and opacity', () => {
	assert.match(reduce, /animation-duration: 0\.01ms !important;/);
	assert.match(reduce, /transition-property: opacity, color, background-color, border-color/);
	assert.doesNotMatch(reduce.slice(0, reduce.indexOf('forced-colors')), /transition-property:[^;]*\b(scale|translate|rotate|stroke-dashoffset)\b/);
});

const families = await Promise.all(
	[
		{ file: 'atoms/Checkbox.svelte', attr: 'check', root: 'checkbox', variants: ['draw', 'pop', 'confetti', 'morph'] },
		{ file: 'molecules/RadioGroup.svelte', attr: 'radio', root: 'radio-group', variants: ['spring', 'liquid'] },
		{ file: 'atoms/Switch.svelte', attr: 'switch', root: 'switch', variants: ['squash', 'glow', 'calm'] }
	].map(async (f) => {
		const src = await read(`../src/lib/components/${f.file}`);
		const style = src.slice(src.indexOf('<style>'), src.indexOf('</style>'));
		const css = (compile(src, { filename: f.file, css: 'external' }).css?.code ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
		return { ...f, src, style, css };
	})
);

/**
 * One variant's scope: its parts of the first compiled block that names it.
 * @param {string} css
 * @param {string} attr
 * @param {string} variant
 */
function scopeSelector(css, attr, variant) {
	const re = /(^|\n)([^{}@\n][^{}]*?)\s*\{/g;
	for (const m of css.matchAll(re)) {
		const parts = m[2].trim().split(/,\s*(?![^()]*\))/);
		const own = (/** @type {string} */ p) => [...p.matchAll(new RegExp(`data-fx-${attr}='(\\w+)'`, 'g'))].every((m) => m[1] === variant);
		if (parts.some((p) => p.startsWith(`[data-fx-${attr}='${variant}']`))) return parts.filter(own).join(', ');
	}
	return null;
}

/** @param {{ root?: string, body: string }} html */
function dom(html) {
	return new JSDOM(`<!doctype html><html${html.root ?? ''}><body>${html.body}</body></html>`).window.document;
}

for (const f of families) {
	const [first] = f.variants;

	test(`${f.root}: every variant is scoped to the closest data-fx-${f.attr} ancestor`, () => {
		for (const v of f.variants) {
			const sel = scopeSelector(f.css, f.attr, v);
			assert.ok(sel, `no block for ${v}`);
			assert.match(sel, new RegExp(`:not\\(\\[data-fx-${f.attr}='${v}'\\] \\[data-fx-${f.attr}\\]:not\\(\\[data-fx-${f.attr}='${v}'\\]\\)`), v);
		}
	});

	test(`${f.root}: ${first} applies with no attribute; nearest ancestor wins; none matches nothing`, () => {
		const hash = f.css.match(new RegExp(`\\.${f.root}\\.(svelte-[\\w-]+)`))?.[1];
		assert.ok(hash, `${f.root} has a scoped class`);
		const el = `<span id="t" class="${f.root} ${hash}"></span>`;
		const cases = [
			{ root: '', body: el, want: first },
			{ root: ` data-fx-${f.attr}="${f.variants[1]}"`, body: el, want: f.variants[1] },
			{ root: ` data-fx-${f.attr}="${f.variants[1]}"`, body: `<div data-fx-${f.attr}="${first}">${el}</div>`, want: first },
			{ root: ` data-fx-${f.attr}="${first}"`, body: `<div data-fx-${f.attr}="${f.variants.at(-1)}">${el}</div>`, want: f.variants.at(-1) },
			{ root: '', body: `<div data-fx-${f.attr}="${f.variants.at(-1)}">${el}</div>`, want: f.variants.at(-1) },
			{ root: ` data-fx-${f.attr}="${f.variants[1]}"`, body: `<div data-fx-${f.attr}="none">${el}</div>`, want: null },
			{ root: ` data-fx-${f.attr}="none"`, body: el, want: null }
		];
		for (const c of cases) {
			const t = /** @type {Element} */ (dom(c).getElementById('t'));
			const matched = f.variants.filter((v) => t.matches(scopeSelector(f.css, f.attr, v) ?? ':not(*)'));
			assert.deepEqual(matched, c.want ? [c.want] : [], `${c.root} ${c.body}`);
		}
	});

	test(`${f.root}: reduced motion falls back to the global reset (no movement, colour still fades)`, () => {
		assert.doesNotMatch(f.style, /!important/);
		for (const m of f.style.matchAll(/animation: ([\w-]+)/g)) assert.ok(m[1] === 'none' || /^(cb|sw)-/.test(m[1]), m[1]);
	});

	test(`${f.root}: effect colours come from theme tokens only`, () => {
		assert.doesNotMatch(f.style, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(|\b(white|black)\b(?!-)/i);
	});

	test(`${f.root}: effects never animate layout properties`, () => {
		for (const m of f.style.matchAll(/transition:([^;]+);/g))
			assert.doesNotMatch(m[1], /\b(width|height|top|left|right|bottom|margin|padding|inset)\b/, m[1]);
		for (const m of f.style.matchAll(/@keyframes [\w-]+ \{([\s\S]*?)\n\t\}/g))
			assert.doesNotMatch(m[1], /\b(width|height|top|left|margin|padding|inset)\s*:/);
	});
}

test('one-shot animations wait for a user interaction (armed)', () => {
	const [cb, , sw] = families;
	assert.match(cb.src, /armed = true;\n\t\tonchange\?\.\(e\);/);
	assert.match(cb.src, /class:armed/);
	assert.match(sw.src, /checked = !checked;\n\t\tarmed = true;/);
	assert.match(sw.src, /class:armed/);
	for (const f of [cb, sw]) for (const m of f.style.matchAll(/\n\t\t(&[^{]*)\{\n\t\t\tanimation: (?!none)/g)) assert.match(m[1], /\.armed/, m[1]);
});

test('checkbox keeps the plain clip-path mark for none and draws an svg tick for the others', () => {
	const [cb] = families;
	assert.match(cb.src, /<path class="tick" pathLength="1" d="M5.5 10.5l3 3 6-7" \/>/);
	assert.match(cb.style, /clip-path: polygon\(41% 67%/);
	assert.match(cb.style, /& input:indeterminate \+ \.box \.fx::before \{/);
});

test('switch calm has no streak or halo and no overshoot', () => {
	const sw = families[2];
	const calm = sw.style.slice(sw.style.indexOf('/* Calm'));
	const block = calm.slice(0, calm.indexOf('\n\t}\n'));
	assert.doesNotMatch(block, /animation|radial-gradient|linear-gradient|spring/);
	assert.match(block, /translate var\(--dur-slow\) var\(--ease-in-out\)/);
});

test('each component demos its variants side by side', async () => {
	const demos = {
		'atoms/Checkbox': ['draw', 'pop', 'confetti', 'morph', 'none'],
		'atoms/Switch': ['squash', 'glow', 'calm', 'none'],
		'molecules/RadioGroup': ['spring', 'liquid', 'none']
	};
	for (const [dir, vs] of Object.entries(demos)) {
		const src = await read(`../src/demo/${dir}/04-MicroInteractions.svelte`);
		assert.match(src, /data-fx-(check|switch|radio)=\{v\}/);
		assert.match(src, new RegExp(`\\[${vs.map((v) => `'${v}'`).join(', ')}\\]`), dir);
	}
});
