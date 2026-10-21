import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const tokens = await readFile(new URL('../src/lib/styles/tokens.css', import.meta.url), 'utf8');
const reset = await readFile(new URL('../src/lib/styles/reset.css', import.meta.url), 'utf8');

/** @param {string} css */
function block(css, open) {
	const start = css.indexOf(open);
	assert.ok(start >= 0, `missing ${open}`);
	let depth = 0;
	for (let i = start; i < css.length; i++) {
		if (css[i] === '{') depth++;
		if (css[i] === '}' && --depth === 0) return css.slice(start, i + 1);
	}
	assert.fail(`unterminated ${open}`);
}

/** @param {string} css */
function decls(css) {
	/** @type {Map<string, string>} */
	const out = new Map();
	for (const m of css.matchAll(/^\s*([\w-]+):\s*([^;]+)\s*(!important)?;/gm)) {
		out.set(m[1], m[2].replace(/\s+/g, ' ').trim() + (m[3] ? ' !important' : ''));
	}
	return out;
}

const root = decls(block(tokens, ':root {'));
const supportsBlock = block(tokens, '@supports (animation-timing-function: linear(0, 1)) {');
const spring = decls(block(supportsBlock, ':root {'));
const reduced = block(reset, '@media (prefers-reduced-motion: reduce) {');
const reducedRoot = decls(block(reduced, ':root {'));
const reducedAll = decls(block(reduced, '*,'));

const expected = {
	'--ease': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
	'--ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
	'--ease-in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
	'--ease-drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
	'--ease-spring': 'var(--ease-out)',
	'--ease-spring-bounce': 'cubic-bezier(0.34, 1.36, 0.64, 1)',
	'--dur-instant': '0ms',
	'--dur-press': '100ms',
	'--dur-fast': '120ms',
	'--dur-base': '180ms',
	'--dur-slow': '240ms',
	'--dur-sheet': '280ms',
	'--dur-exit-fast': '80ms',
	'--dur-exit': '140ms',
	'--dur-exit-slow': '200ms',
	'--dur-spring': '250ms',
	'--dur-spring-bounce': '330ms',
	'--press-scale': '0.97',
	'--press-scale-sm': '0.92',
	'--press-scale-lg': '0.985',
	'--enter-scale': '0.96',
	'--tip-scale': '0.97',
	'--shift-xs': '2px',
	'--shift-sm': '4px',
	'--shift-md': '8px'
};

test('every motion token is defined on :root with its specified value', () => {
	for (const [name, value] of Object.entries(expected)) assert.equal(root.get(name), value, name);
});

test('each motion token is declared exactly once in :root', () => {
	const rootCss = block(tokens, ':root {');
	for (const name of Object.keys(expected)) {
		const count = rootCss.match(new RegExp(`^\\s*${name}:`, 'gm'))?.length ?? 0;
		assert.equal(count, 1, name);
	}
});

test('durations respect the budget ladder and exits run faster than enters', () => {
	const ms = (/** @type {string} */ n) => Number.parseInt(/** @type {string} */ (root.get(n)), 10);
	assert.ok(ms('--dur-press') < ms('--dur-fast'));
	assert.ok(ms('--dur-fast') < ms('--dur-base'));
	assert.ok(ms('--dur-base') < ms('--dur-slow'));
	assert.ok(ms('--dur-slow') < ms('--dur-sheet'));
	assert.ok(ms('--dur-exit-fast') < ms('--dur-fast'));
	assert.ok(ms('--dur-exit') < ms('--dur-base'));
	assert.ok(ms('--dur-exit-slow') < ms('--dur-sheet'));
	for (const [name, value] of Object.entries(expected)) {
		if (name.startsWith('--dur-')) assert.ok(Number.parseInt(value, 10) <= 340, `${name} over budget`);
	}
});

test('springs override the cubic-bezier fallback only where linear() is supported', () => {
	for (const name of ['--ease-spring', '--ease-spring-bounce']) {
		const v = spring.get(name);
		assert.ok(v, name);
		assert.match(v, /^linear\(0, .*, 1\)$/);
		const points = v.slice('linear('.length, -1).split(',').map((p) => Number.parseFloat(p.trim()));
		assert.ok(points.length >= 15 && points.length <= 50, `${name} has ${points.length} points`);
		assert.ok(points.every((p) => Number.isFinite(p) && p >= 0 && p < 1.2), name);
	}
	assert.match(spring.get('--ease-spring') ?? '', /1\.011 64\.4%, 1\)$/);
	assert.match(spring.get('--ease-spring-bounce') ?? '', /1\.073 39\.4%/);
	assert.ok(tokens.indexOf('@supports') > tokens.indexOf(':root {'), '@supports block follows :root');
});

test('reduced motion neutralises every movement token and falls back to --ease-out for springs', () => {
	const neutral = {
		'--press-scale': '1',
		'--press-scale-sm': '1',
		'--press-scale-lg': '1',
		'--enter-scale': '1',
		'--tip-scale': '1',
		'--shift-xs': '0px',
		'--shift-sm': '0px',
		'--shift-md': '0px',
		'--ease-spring': 'var(--ease-out)',
		'--ease-spring-bounce': 'var(--ease-out)'
	};
	for (const [name, value] of Object.entries(neutral)) assert.equal(reducedRoot.get(name), value, name);
	assert.ok(reduced.indexOf(':root {') < reduced.indexOf('*,'), ':root overrides come before the element rule');
});

test('reduced motion keeps colour and opacity fades, stops movement and halts keyframes', () => {
	assert.match(reduced, /^\t\*,\n\t\*::before,\n\t\*::after \{/m);
	assert.equal(reducedAll.get('scroll-behavior'), 'auto !important');
	assert.equal(reducedAll.get('animation-duration'), '0.01ms !important');
	assert.equal(reducedAll.get('animation-iteration-count'), '1 !important');
	assert.equal(reducedAll.get('transition-duration'), 'var(--dur-fast) !important');
	assert.equal(reducedAll.get('transition-delay'), '0ms !important');
	const props = (reducedAll.get('transition-property') ?? '').replace(' !important', '').split(/,\s*/);
	assert.deepEqual(props, [
		'opacity',
		'color',
		'background-color',
		'border-color',
		'outline-color',
		'box-shadow',
		'fill',
		'stroke',
		'text-decoration-color',
		'visibility',
		'display',
		'overlay'
	]);
	for (const moving of ['transform', 'translate', 'scale', 'rotate', 'width', 'height', 'top', 'left', 'all']) {
		assert.ok(!props.includes(moving), `${moving} must not transition under reduced motion`);
	}
	assert.doesNotMatch(reduced, /transition-duration: 0\.01ms/);
	assert.doesNotMatch(reduced, /transition: none/);
});

test('reset.css consumes tokens only: no raw durations outside the animation halt', () => {
	const raw = reset.match(/\b\d+(\.\d+)?m?s\b/g) ?? [];
	assert.deepEqual(raw, ['0.01ms', '0ms']);
});
