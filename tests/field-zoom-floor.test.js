import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [tokens, reset, input, textarea, select] = await Promise.all([
	read('styles/tokens.css'),
	read('styles/reset.css'),
	read('components/atoms/Input.svelte'),
	read('components/atoms/Textarea.svelte'),
	read('components/atoms/Select.svelte')
]);

const strip = (/** @type {string} */ css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const fontTokens = (() => {
	/** @type {Record<string, number>} */
	const out = {};
	for (const [, name, rem] of strip(tokens).matchAll(
		/--(fs-[a-z0-9]+):\s*calc\(([\d.]+)rem\s*\*\s*var\(--fs-scale\)\)/g
	))
		out[name] = Number(rem);
	return out;
})();

/** @returns {number} */
function px(/** @type {string} */ value, /** @type {number} */ rootPx, /** @type {number} */ scale) {
	const v = value.trim();
	const max = v.match(/^max\((.*)\)$/s);
	if (max) return Math.max(...splitArgs(max[1]).map((a) => px(a, rootPx, scale)));
	const variable = v.match(/^var\(--([a-z0-9-]+)\)$/);
	if (variable) {
		const rem = fontTokens[variable[1]];
		assert.ok(rem !== undefined, `unknown token --${variable[1]}`);
		return rem * scale * rootPx;
	}
	const px_ = v.match(/^([\d.]+)px$/);
	if (px_) return Number(px_[1]);
	const rem_ = v.match(/^([\d.]+)rem$/);
	if (rem_) return Number(rem_[1]) * rootPx;
	throw new Error(`cannot evaluate font-size: ${value}`);
}

function splitArgs(/** @type {string} */ s) {
	/** @type {string[]} */
	const out = [];
	let depth = 0;
	let cur = '';
	for (const ch of s) {
		if (ch === '(') depth++;
		if (ch === ')') depth--;
		if (ch === ',' && depth === 0) {
			out.push(cur);
			cur = '';
		} else cur += ch;
	}
	out.push(cur);
	return out;
}

/**
 * @returns {{selector: string, value: string, pointer: string | null, order: number}[]}
 */
function fontSizeRules(/** @type {string} */ css, /** @type {{ order: number }} */ counter) {
	/** @type {{selector: string, value: string, pointer: string | null, order: number}[]} */
	const out = [];
	/** @param {string} body @param {string | null} pointer */
	const walk = (body, pointer) => {
		let i = 0;
		while (i < body.length) {
			const brace = body.indexOf('{', i);
			if (brace === -1) break;
			const prelude = body.slice(i, brace).trim();
			let depth = 1;
			let j = brace + 1;
			for (; j < body.length && depth > 0; j++) {
				if (body[j] === '{') depth++;
				else if (body[j] === '}') depth--;
			}
			const block = body.slice(brace + 1, j - 1);
			if (prelude.startsWith('@')) {
				const m = prelude.match(/\(\s*pointer\s*:\s*(coarse|fine)\s*\)/);
				walk(block, m ? m[1] : pointer);
			} else {
				const decl = [...block.matchAll(/(?:^|;)\s*font-size\s*:\s*([^;}]+)/g)].pop();
				if (decl)
					for (const selector of prelude.split(','))
						out.push({ selector: selector.trim(), value: decl[1].trim(), pointer, order: counter.order++ });
			}
			i = j;
		}
	};
	walk(css, null);
	return out;
}

const styleOf = (/** @type {string} */ svelte) => {
	const m = svelte.match(/<style>([\s\S]*)<\/style>/);
	assert.ok(m, 'component has a <style> block');
	return m[1];
};

const counter = { order: 0 };
const sheets = [
	{ rules: fontSizeRules(strip(reset), counter), scoped: false },
	...[input, textarea, select].map((src) => ({ rules: fontSizeRules(strip(styleOf(src)), counter), scoped: true }))
];

/**
 * @param {{ tag: string, classes: string[] }} el
 * @param {'coarse' | 'fine'} pointer
 */
function computedFontSize(el, pointer, rootPx = 16, scale = 1) {
	let best = null;
	for (const { rules, scoped } of sheets)
		for (const rule of rules) {
			if (rule.pointer && rule.pointer !== pointer) continue;
			const parts = rule.selector.match(/^([a-z][a-z0-9-]*)?((?:\.[a-z][a-z0-9-]*)*)$/i);
			if (!parts) continue; // descendant / pseudo / attribute selectors are out of scope here
			const [, tag, classPart] = parts;
			const classes = classPart ? classPart.slice(1).split('.') : [];
			if (tag && tag !== el.tag) continue;
			if (!classes.every((c) => el.classes.includes(c))) continue;
			// Svelte appends one scoping class to every selector in a component <style>.
			const specificity = [classes.length + (scoped ? 1 : 0), tag ? 1 : 0];
			if (
				!best ||
				specificity[0] > best.specificity[0] ||
				(specificity[0] === best.specificity[0] &&
					(specificity[1] > best.specificity[1] ||
						(specificity[1] === best.specificity[1] && rule.order > best.order)))
			)
				best = { ...rule, specificity };
		}
	assert.ok(best, `no font-size matched ${el.tag}.${el.classes.join('.')}`);
	return px(best.value, rootPx, scale);
}

/** @type {Record<string, { tag: string, classes: string[] }>} */
const variants = {
	'Input md': { tag: 'input', classes: ['input'] },
	'Input sm': { tag: 'input', classes: ['input', 'input-sm'] },
	'Input lg': { tag: 'input', classes: ['input', 'input-lg'] },
	'Textarea md': { tag: 'textarea', classes: ['textarea'] },
	'Textarea sm': { tag: 'textarea', classes: ['textarea', 'textarea-sm'] },
	'Textarea lg': { tag: 'textarea', classes: ['textarea', 'textarea-lg'] },
	'Select md': { tag: 'select', classes: ['select'] },
	'Select sm': { tag: 'select', classes: ['select', 'select-sm', 'compact'] },
	'Select lg': { tag: 'select', classes: ['select', 'select-lg'] },
	'Select compact': { tag: 'select', classes: ['select', 'compact'] },
	'Select face compact': { tag: 'span', classes: ['select-face', 'compact'] }
};

test('the token scale parsed from tokens.css covers the sizes the fields use', () => {
	for (const name of ['fs-xs', 'fs-sm', 'fs-base', 'fs-md']) assert.ok(fontTokens[name] > 0, name);
	assert.ok(fontTokens['fs-md'] > fontTokens['fs-base'], '--fs-md must exceed --fs-base');
});

for (const scale of [1, 0.875, 0.75]) {
	test(`coarse pointer: every field variant stays at or above 16px (--fs-scale: ${scale})`, () => {
		for (const [name, el] of Object.entries(variants)) {
			const size = computedFontSize(el, 'coarse', 16, scale);
			assert.ok(size >= 16, `${name} computes ${size}px on a coarse pointer, below the 16px iOS floor`);
		}
	});
}

test('fine pointer: lg is never smaller than md', () => {
	for (const [lg, md] of [
		['Input lg', 'Input md'],
		['Textarea lg', 'Textarea md'],
		['Select lg', 'Select md']
	])
		for (const scale of [1, 0.875, 0.75]) {
			const l = computedFontSize(variants[lg], 'fine', 16, scale);
			const m = computedFontSize(variants[md], 'fine', 16, scale);
			assert.ok(l >= m, `${lg} (${l}px) is smaller than ${md} (${m}px) at --fs-scale: ${scale}`);
		}
});

test('fine pointer: sm and compact keep their dense sizes', () => {
	assert.equal(computedFontSize(variants['Input sm'], 'fine'), fontTokens['fs-sm'] * 16);
	assert.equal(computedFontSize(variants['Textarea sm'], 'fine'), fontTokens['fs-sm'] * 16);
	assert.equal(computedFontSize(variants['Select compact'], 'fine'), fontTokens['fs-xs'] * 16);
	assert.equal(computedFontSize(variants['Select face compact'], 'fine'), fontTokens['fs-xs'] * 16);
});
