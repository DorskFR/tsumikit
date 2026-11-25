import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const tokens = await readFile(new URL('../src/lib/styles/tokens.css', import.meta.url), 'utf8');
const root = tokens.slice(tokens.indexOf(':root {'), tokens.indexOf('\n}', tokens.indexOf(':root {')));

/** @type {Map<string, string[]>} */
const decls = new Map();
for (const m of root.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)) {
	const list = decls.get(m[1]) ?? [];
	list.push(m[2].replace(/\s+/g, ' ').trim());
	decls.set(m[1], list);
}
const value = (/** @type {string} */ name) => decls.get(name)?.[0];

/** @param {string} v @returns {string} */
function resolve(v, depth = 0) {
	assert.ok(depth < 10, `cycle while resolving ${v}`);
	return v.replace(/var\((--[\w-]+)\)/g, (_, n) => {
		const inner = value(n);
		assert.ok(inner, `${n} is not defined`);
		return resolve(inner, depth + 1);
	});
}

const expected = {
	'--fs-2xs': 'var(--fs-xs)',
	'--fs-md': 'var(--fs-base)',
	'--fs-3xl': 'var(--fs-2xl)',
	'--lh-none': '1',
	'--lh-heading': '1.2',
	'--lh-snug': '1.375',
	'--sp-px': '1px',
	'--sp-0-5': '0.125rem',
	'--sp-1-5': '0.375rem',
	'--r-xs': '2px',
	'--control-sm': 'var(--control-height-compact)',
	'--control-md': 'var(--control-height-default)',
	'--control-lg': 'var(--control-height-large)',
	'--control-fs-sm': 'var(--fs-xs)',
	'--control-fs-md': 'var(--fs-sm)',
	'--control-fs-lg': 'var(--fs-base)',
	'--control-px-sm': 'var(--sp-2)',
	'--control-px-md': 'var(--sp-3)',
	'--control-px-lg': 'var(--sp-4)',
	'--control-icon-sm': 'var(--icon-sm)',
	'--control-icon-md': 'var(--icon-md)',
	'--control-icon-lg': 'var(--icon-lg)',
	'--btn-px-sm': 'var(--sp-3)',
	'--btn-px-md': 'var(--sp-4)',
	'--btn-px-lg': 'var(--sp-6)',
	'--chip-xs': '1rem',
	'--chip-sm': '1.25rem',
	'--chip-md': '1.5rem',
	'--icon-xs': 'calc(0.75rem * var(--fs-scale))',
	'--icon-sm': 'calc(0.875rem * var(--fs-scale))',
	'--icon-md': 'calc(1rem * var(--fs-scale))',
	'--icon-lg': 'calc(1.25rem * var(--fs-scale))',
	'--icon-xl': 'calc(1.5rem * var(--fs-scale))',
	'--disabled-opacity': '0.45',
	'--focus-ring-width': '2px',
	'--focus-ring-offset-inset': 'calc(-1 * var(--focus-ring-width))'
};

test('every refinement token is defined exactly once with its documented value', () => {
	for (const [name, v] of Object.entries(expected)) {
		assert.deepEqual(decls.get(name), [v], name);
	}
});

test('md controls sit on the 40px rung and the focus ring sits 2px out', () => {
	assert.equal(value('--box-md'), '2.5rem');
	assert.equal(value('--box-md'), value('--control-height-default'));
	assert.equal(value('--focus-ring-offset'), '2px');
	assert.equal(value('--focus-ring'), '2px solid var(--accent)');
	assert.equal(resolve(value('--focus-ring-offset-inset') ?? ''), 'calc(-1 * 2px)');
});

test('the pre-existing scale keeps its names and values', () => {
	const kept = {
		'--fs-xs': 'calc(0.75rem * var(--fs-scale))',
		'--fs-sm': 'calc(0.8125rem * var(--fs-scale))',
		'--fs-base': 'calc(0.9375rem * var(--fs-scale))',
		'--fs-lg': 'calc(1.125rem * var(--fs-scale))',
		'--fs-xl': 'calc(1.375rem * var(--fs-scale))',
		'--fs-2xl': 'calc(1.75rem * var(--fs-scale))',
		'--lh-tight': '1.25',
		'--lh-normal': '1.5',
		'--r-sm': '6px',
		'--r-md': '10px',
		'--r-lg': '14px',
		'--r-pill': '999px',
		'--control-height-compact': '2rem',
		'--control-height-default': '2.5rem',
		'--control-height-large': '3rem',
		'--control-height': '2.75rem',
		'--box-xs': '1.5rem',
		'--box-sm': 'var(--control-height-compact)',
		'--box-lg': 'var(--control-height-default)'
	};
	for (const [name, v] of Object.entries(kept)) assert.deepEqual(decls.get(name), [v], name);
});

test('every font-size and icon-size token scales with --fs-scale', () => {
	const scaled = [...decls.keys()].filter((n) => /^--(fs|icon)-/.test(n) && !['--fs-scale', '--fs-2xs', '--fs-md', '--fs-3xl'].includes(n));
	assert.ok(scaled.length >= 11);
	for (const n of scaled) assert.match(value(n) ?? '', /^calc\([\d.]+rem \* var\(--fs-scale\)\)$/, n);
});

test('type, spacing, radius and control ladders are strictly increasing', () => {
	const px = (/** @type {string} */ n) => {
		const v = resolve(value(n) ?? '');
		const m = v.match(/([\d.]+)(rem|px)/);
		assert.ok(m, `${n} has no length: ${v}`);
		return Number(m[1]) * (m[2] === 'rem' ? 16 : 1);
	};
	const ladders = [
		['--fs-xs', '--fs-sm', '--fs-base', '--fs-lg', '--fs-xl', '--fs-2xl'],
		['--sp-0', '--sp-px', '--sp-0-5', '--sp-1', '--sp-1-5', '--sp-2', '--sp-3', '--sp-4', '--sp-5', '--sp-6', '--sp-8', '--sp-10', '--sp-12'],
		['--r-xs', '--r-sm', '--r-md', '--r-lg', '--r-pill'],
		['--control-sm', '--control-md', '--control-lg'],
		['--control-fs-sm', '--control-fs-md', '--control-fs-lg'],
		['--control-px-sm', '--control-px-md', '--control-px-lg'],
		['--btn-px-sm', '--btn-px-md', '--btn-px-lg'],
		['--icon-xs', '--icon-sm', '--icon-md', '--icon-lg', '--icon-xl'],
		['--chip-xs', '--chip-sm', '--chip-md'],
		['--box-xs', '--box-sm', '--box-md'],
		['--lh-none', '--lh-heading', '--lh-tight', '--lh-snug', '--lh-normal']
	];
	for (const ladder of ladders) {
		const values = ladder.map((n) => (n.startsWith('--lh') ? Number(value(n)) : n === '--sp-0' ? 0 : px(n)));
		for (let i = 1; i < values.length; i++) {
			assert.ok(values[i] > values[i - 1], `${ladder[i]} (${values[i]}) <= ${ladder[i - 1]} (${values[i - 1]})`);
		}
	}
	for (const [n, want] of [['--control-sm', 32], ['--control-md', 40], ['--control-lg', 48], ['--box-md', 40], ['--chip-md', 24], ['--icon-md', 16], ['--fs-xs', 12], ['--fs-sm', 13], ['--fs-base', 15], ['--fs-lg', 18], ['--fs-xl', 22], ['--fs-2xl', 28]]) {
		assert.equal(px(String(n)), want, String(n));
	}
});

test('every alias resolves to a defined token', () => {
	for (const [n, [v]] of decls) {
		if (/var\(--[\w-]+\)/.test(v) && !/env\(/.test(v)) resolve(v);
	}
});

test('scaled type and icon sizes round to whole pixels where round() is supported', () => {
	const block = tokens.match(/@supports \(width: round\(1\.5px, 1px\)\) \{\s*:root \{([^}]*)\}/)?.[1];
	assert.ok(block, 'round() override block');
	const steps = ['--fs-xs', '--fs-sm', '--fs-base', '--fs-lg', '--fs-xl', '--fs-2xl', '--icon-xs', '--icon-sm', '--icon-md', '--icon-lg', '--icon-xl'];
	for (const n of steps) {
		const exact = value(n);
		assert.ok(block.includes(`${n}: round(${exact}, 1px);`), n);
	}
});
