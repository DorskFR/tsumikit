import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { compile } from 'svelte/compiler';

const source = await readFile(
	new URL('../src/lib/components/layouts/ResizablePanel.svelte', import.meta.url),
	'utf8'
);
const css = compile(source, { filename: 'ResizablePanel.svelte', css: 'external' }).css.code.replace(/\s+/g, ' ');
const media = (/** @type {string} */ query) => {
	const start = css.indexOf(`@media ${query} {`);
	assert.notEqual(start, -1, query);
	let depth = 0;
	for (let i = css.indexOf('{', start); i < css.length; i++) {
		if (css[i] === '{') depth++;
		else if (css[i] === '}' && --depth === 0) return css.slice(start, i + 1);
	}
	return '';
};

test('reduced motion cancels the overlay slide with selectors as specific as the animation rules', () => {
	const reduced = media('(prefers-reduced-motion: reduce)');
	for (const animated of [/(\.overlay\.svelte-[\w-]+ \.panel:where\(\.svelte-[\w-]+\)) \{[^}]*animation: /, /(\.overlay\.right\.svelte-[\w-]+ \.panel:where\(\.svelte-[\w-]+\)) \{[^}]*animation-name: /]) {
		const selector = css.match(animated)?.[1];
		assert.ok(selector, String(animated));
		const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		assert.match(reduced, new RegExp(`${escaped}[^{]*\\{[^}]*animation: none;`), selector);
	}
});

test('coarse pointers grow the collapse chevron to --touch-target with an invisible slab', () => {
	const coarse = media('(pointer: coarse)');
	assert.match(coarse, /\.collapse-control\.svelte-[\w-]+::before \{[^}]*content: '';[^}]*position: absolute;/);
	assert.match(coarse, /inset-block: min\(0px, calc\(\(100% - var\(--touch-target\)\) \/ 2\)\);/);
	assert.match(coarse, /inset-inline: min\(0px, calc\(\(100% - var\(--touch-target\)\) \/ 2\)\);/);
	assert.match(css, /\.collapse-control\.svelte-[\w-]+ \{[^}]*position: absolute;/);
});
