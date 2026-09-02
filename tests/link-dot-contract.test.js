import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const link = await readFile(
	new URL('../src/lib/components/atoms/Link.svelte', import.meta.url),
	'utf8'
);
const dot = await readFile(
	new URL('../src/lib/components/atoms/Dot.svelte', import.meta.url),
	'utf8'
);

test('Link defaults preserve the accent + always-underlined look', () => {
	assert.match(link, /tone = 'accent'/);
	assert.match(link, /underline = 'always'/);
	assert.match(link, /align = 'start'/);
	assert.match(link, /color: var\(--accent, var\(--text\)\);/);
	assert.match(link, /\.link \{[^}]*text-decoration: underline;/);
});

test('Link tone maps to theme tokens or inherits', () => {
	assert.match(link, /tone\?: 'accent' \| 'info' \| 'muted' \| 'inherit';/);
	assert.match(link, /\.tone-info \{\s*color: var\(--info\);/);
	assert.match(link, /\.tone-muted \{\s*color: var\(--text-muted\);/);
	assert.match(link, /\.tone-inherit \{\s*color: inherit;/);
});

test('Link underline can be hover-only or off', () => {
	assert.match(link, /underline\?: 'always' \| 'hover' \| 'none';/);
	assert.match(link, /\.underline-hover,\s*\.underline-none \{\s*text-decoration: none;/);
	assert.match(link, /\.underline-hover:hover \{\s*text-decoration: underline;/);
});

test('Link align applies to both the anchor and button forms', () => {
	assert.match(link, /align\?: 'start' \| 'center';/);
	assert.match(link, /\.link \{[^}]*text-align: start;/);
	assert.match(link, /\.align-center \{\s*text-align: center;/);
	const classAttr = /class="link tone-\{tone\} underline-\{underline\} align-\{align\} \{klass\}"/g;
	assert.equal(link.match(classAttr)?.length, 2);
});

test('Dot ring adds a dark halo and composes with glow', () => {
	assert.match(dot, /ring = false/);
	assert.match(dot, /ring\?: boolean;/);
	assert.equal(dot.match(/class:ring/g)?.length, 2);
	assert.match(dot, /\.ring \{\s*box-shadow: 0 0 0 3px rgb\(0 0 0 \/ 0\.35\);/);
	assert.match(dot, /\.ring\.glow \{\s*box-shadow:\s*0 0 0 3px rgb\(0 0 0 \/ 0\.35\),\s*0 0 6px var\(--dot-color\);/);
});
