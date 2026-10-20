import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { compile } from 'svelte/compiler';
import { hasDecl, normalize } from './helpers.mjs';

const source = await readFile(
	new URL('../src/lib/components/molecules/Breadcrumb.svelte', import.meta.url),
	'utf8'
);
const css = source.slice(source.indexOf('<style>'));
const flat = normalize(css);

test('Breadcrumb compiles', () => {
	assert.doesNotThrow(() => compile(source, { filename: 'Breadcrumb.svelte' }));
});

test('new props are optional with non-breaking defaults', () => {
	assert.match(source, /size\?: 'sm' \| 'md';/);
	assert.match(source, /wrap\?: boolean;/);
	assert.match(source, /collapseCurrent\?: boolean;/);
	assert.match(source, /size = 'sm',/);
	assert.match(source, /wrap = true,/);
	assert.match(source, /collapseCurrent = false,/);
	assert.ok(hasDecl(css, '.crumbs', 'flex-wrap', 'wrap'), 'wraps by default');
	assert.ok(hasDecl(css, '.crumbs', 'font-size', 'var(--fs-sm)'), 'sm by default');
	assert.ok(hasDecl(css, '.current', 'max-width', '24ch'), 'default cap kept');
});

test('size md bumps the trail font and separator icon', () => {
	assert.match(source, /size === 'md' && 'crumbs--md'/);
	assert.ok(hasDecl(css, '.crumbs--md', 'font-size', 'var(--fs-md)'));
	assert.match(source, /size=\{size === 'md' \? 16 : 14\}/);
});

test('wrap=false keeps one line: ancestors keep width, current ellipsis-shrinks uncapped', () => {
	assert.match(source, /!wrap && 'crumbs--nowrap'/);
	assert.ok(hasDecl(css, '.crumbs--nowrap', 'flex-wrap', 'nowrap'));
	assert.ok(hasDecl(css, '.crumbs--nowrap', 'min-width', '0'));
	assert.ok(hasDecl(css, '.crumbs--nowrap .crumb', 'flex-shrink', '0'));
	assert.ok(hasDecl(css, '.crumbs--nowrap .crumb:last-child', 'flex-shrink', '1'));
	assert.ok(hasDecl(css, '.crumbs--nowrap .current', 'max-width', 'none'));
	assert.ok(hasDecl(css, '.current', 'text-overflow', 'ellipsis'));
});

test('collapseCurrent hides the current crumb and its separator, never a lone crumb', () => {
	assert.match(source, /collapseCurrent && 'crumbs--collapse'/);
	assert.match(
		flat,
		/\.crumbs--collapse \.crumb:last-child:not\(:first-child\), \.crumbs--collapse \.crumb:nth-last-child\(2\) \.sep { display: none; }/
	);
});

test('coarse pointers grow ellipsised links to 40px instead of a clipped ::before slab', () => {
	assert.ok(hasDecl(css, '.link', 'overflow', 'hidden'), 'links clip, so a slab would be clipped');
	const at = flat.indexOf('@media (hover: none) and (pointer: coarse) {');
	assert.ok(at > flat.indexOf('.link {'), 'coarse block follows the base link rule');
	const block = flat.slice(at, flat.indexOf('} }', at) + 3);
	assert.match(block, /\.link { min-height: 40px; align-content: center; }/);
	assert.doesNotMatch(css, /\.link::before/);
});
