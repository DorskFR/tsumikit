import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { BREAKPOINTS, isAllowedBreakpointWidth } from '../lint/breakpoints.mjs';
import { RULE_IDS, lintSource, selectRules } from '../lint/index.mjs';

async function lint(fixture, rule) {
	const file = `tests/fixtures/lint/${fixture}`;
	const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
	const { findings } = lintSource(file, source, selectRules({ only: [rule] }));
	return findings;
}

const lines = (findings) => findings.map((f) => f.line);

test('no-raw-color flags hex/rgb/hsl outside theme blocks, inline too', async () => {
	const f = await lint('no-raw-color.svelte', 'no-raw-color');
	assert.deepEqual(lines(f), [1, 2, 14, 15, 16]);
	assert.match(f[0].message, /#abc/);
	assert.match(f[3].message, /rgba\(0, 0, 0, 0\.5\)/);
});

test('no-raw-color allows :root/[data-theme] blocks, custom properties, var()-composed and relative colors, url()', async () => {
	const f = await lint('no-raw-color.svelte', 'no-raw-color');
	for (const l of [6, 7, 8, 11, 19, 20, 21, 22, 23, 24]) assert.ok(!lines(f).includes(l), `line ${l}`);
});

test('no-raw-color honours previous-line and same-line ignore comments', async () => {
	const f = await lint('no-raw-color.svelte', 'no-raw-color');
	assert.ok(!lines(f).includes(29));
	assert.ok(!lines(f).includes(30));
});

test('spacing-scale flags raw px/rem in spacing properties and suggests the token', async () => {
	const f = await lint('spacing-scale.svelte', 'spacing-scale');
	assert.deepEqual(lines(f), [1, 2, 6, 6, 7, 8, 9, 10]);
	assert.match(f[1].message, /use var\(--sp-2\)/);
	assert.match(f[3].message, /2px.*use var\(--sp-0-5\)/);
	assert.match(f[5].message, /3px.*not on the --sp-\* scale/);
	assert.match(f[7].message, /calc\(-1 \* var\(--sp-1\)\)/);
});

test('spacing-scale allows tokens, 0, 1px hairlines, %, em, calc with var, non-spacing properties and custom properties', async () => {
	const f = await lint('spacing-scale.svelte', 'spacing-scale');
	assert.ok(lines(f).every((l) => l <= 10), JSON.stringify(f));
});

test('no-raw-control flags raw controls, allows atoms, hidden inputs and ignored lines', async () => {
	const f = await lint('no-raw-control.svelte', 'no-raw-control');
	assert.deepEqual(lines(f), [5, 6, 7, 8]);
	assert.match(f[0].message, /Button atom/);
	assert.match(f[3].message, /Textarea atom/);
});

test('one-primary flags a second primary in the same branch, in the root and inside a snippet', async () => {
	const f = await lint('one-primary.svelte', 'one-primary');
	assert.deepEqual(lines(f), [9, 17]);
	assert.match(f[0].message, /first at line 6/);
	assert.match(f[1].message, /first at line 16/);
});

test('one-primary allows exclusive if/else branches, dynamic variants and one primary per snippet', async () => {
	const f = await lint('one-primary-ok.svelte', 'one-primary');
	assert.deepEqual(f, []);
});

test('no-raw-font flags raw font stacks and --font-mono on non-code selectors', async () => {
	const f = await lint('no-raw-font.svelte', 'no-raw-font');
	assert.deepEqual(lines(f), [1, 9, 12, 15]);
	assert.match(f[0].message, /Georgia/);
	assert.match(f[2].message, /--font-mono on a non-code element \(\.meta\)/);
	assert.match(f[3].message, /\.sessionId/);
});

test('no-raw-font allows tokens, :root, --font-numeric, mono on code-ish selectors and ignored lines', async () => {
	const f = await lint('no-raw-font.svelte', 'no-raw-font');
	for (const l of [2, 6, 18, 21, 26, 30]) assert.ok(!lines(f).includes(l), `line ${l}`);
});

test('breakpoints flags media widths outside the kit list and allows min/max/range forms', async () => {
	const f = await lint('breakpoints.css', 'breakpoints');
	assert.deepEqual(lines(f), [6, 7, 8, 9]);
	assert.match(f[0].message, /959px/);
	assert.match(f[3].message, /50rem/);
});

test('breakpoint list is exported and lenient on max-width complements', () => {
	assert.deepEqual(
		BREAKPOINTS.map((b) => [b.name, b.rem, b.px]),
		[
			['sm', 40, 640],
			['md', 48, 768],
			['lg', 64, 1024]
		]
	);
	for (const ok of ['640px', '40rem', '48em', '1024px', '639px', '639.98px', '39.999rem', '63.999rem', '767.98px']) {
		assert.ok(isAllowedBreakpointWidth(ok), ok);
	}
	for (const bad of ['959px', '430px', '720px', '50rem', '638px', '641px', '100%', '640']) {
		assert.ok(!isAllowedBreakpointWidth(bad), bad);
	}
});

test('motion flags transition: all, layout properties, and keyframes on layout properties', async () => {
	const f = await lint('motion.css', 'motion');
	assert.deepEqual(lines(f), [2, 5, 8, 24, 25]);
	assert.match(f[0].message, /transition: all/);
	assert.match(f[1].message, /"height"/);
	assert.match(f[2].message, /"width"/);
	assert.match(f[3].message, /keyframe animates "height"/);
});

test('motion allows the paint-only list, var() shorthands, discrete display/overlay and custom properties', async () => {
	const f = await lint('motion.css', 'motion');
	for (const l of [11, 14, 17, 20, 21, 30]) assert.ok(!lines(f).includes(l), `line ${l}`);
});

test('img-alt flags <img> without alt, allows alt="", spreads and ignored lines', async () => {
	const f = await lint('img-alt.svelte', 'img-alt');
	assert.deepEqual(lines(f), [5]);
});

test('selectRules supports --rule / --disable and rejects unknown ids', () => {
	assert.deepEqual(RULE_IDS, [
		'no-raw-color',
		'spacing-scale',
		'no-raw-control',
		'one-primary',
		'no-raw-font',
		'breakpoints',
		'motion',
		'img-alt'
	]);
	assert.deepEqual(selectRules({ only: ['motion'] }).map((r) => r.id), ['motion']);
	assert.ok(!selectRules({ disable: ['motion'] }).some((r) => r.id === 'motion'));
	assert.throws(() => selectRules({ only: ['nope'] }), /unknown rule\(s\): nope/);
});

test('lintSource reports unparsable files as a single parse-error finding', () => {
	const { findings } = lintSource('broken.svelte', '<div', selectRules());
	assert.equal(findings.length, 1);
	assert.equal(findings[0].rule, 'parse-error');
});
