import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/atoms/Scrim.svelte', import.meta.url),
	'utf8'
);
const index = await readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8');

test('Scrim is a fixed full-viewport close target on the drawer layer', () => {
	assert.match(source, /onclose\?: \(\) => void/);
	assert.match(source, /hideBelow\?: string/);
	assert.match(source, /z = 'var\(--z-drawer\)'/);
	assert.match(source, /label = 'Close'/);
	assert.match(source, /<button\s+type="button"\s+class="scrim"/);
	assert.match(source, /style:z-index={z}/);
	assert.match(source, /aria-label={label}/);
	assert.match(source, /tabindex="-1"/);
	assert.match(source, /data-tsu="Scrim"/);
	assert.match(source, /\.scrim\s*{[^}]*position: fixed;[^}]*inset: 0;/s);
});

test('Scrim closes on Escape from anywhere in the document and hides below its breakpoint', () => {
	assert.match(source, /document\.addEventListener\('keydown', onKeydown\)/);
	assert.match(source, /event\.key !== 'Escape' \|\| event\.defaultPrevented/);
	assert.match(source, /matchMedia\(`\(max-width: \$\{hideBelow\}\)`\)/);
	assert.match(source, /{#if !hidden}/);
	assert.match(source, /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.scrim\s*{[^}]*animation: none;/s);
});

test('Scrim and the resizeHandle action are part of the public API', () => {
	assert.match(index, /export { default as Scrim } from '\.\/components\/atoms\/Scrim\.svelte';/);
	assert.match(index, /resizeHandle,\s*} from '\.\/components\/layouts\/resizable-panel-frame\.js';/);
	assert.match(index, /type ResizeHandleParams,/);
});
