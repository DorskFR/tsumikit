import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/atoms/Divider.svelte', import.meta.url),
	'utf8'
);
const index = await readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8');
const docs = await readFile(new URL('../src/routes/+page.svelte', import.meta.url), 'utf8');

test('Divider prop surface and defaults', () => {
	assert.match(source, /orientation\?: 'horizontal' \| 'vertical';/);
	assert.match(source, /orientation = 'horizontal'/);
	assert.match(source, /spacing\?: string;/);
	assert.match(source, /tone\?: 'default' \| 'strong' \| 'faint';/);
	assert.match(source, /tone = 'default'/);
	assert.match(source, /children\?: Snippet;/);
	assert.match(source, /decorative\?: boolean;/);
	assert.match(source, /decorative = false/);
	assert.match(source, /class: klass = ''/);
});

test('decorative dividers are hidden, everything else is a semantic separator', () => {
	assert.match(source, /const semantic = \$derived\(!decorative \|\| !!children\);/);
	assert.match(source, /role={semantic \? 'separator' : undefined}/);
	assert.match(source, /aria-orientation={semantic \? orientation : undefined}/);
	assert.match(source, /aria-hidden={semantic \? undefined : 'true'}/);
});

test('spacing rides a custom property applied along the axis', () => {
	assert.match(source, /style:--divider-spacing={spacing}/);
	assert.match(source, /--divider-spacing: var\(--sp-3\);/);
	assert.match(source, /\.horizontal \{[^}]*margin-block: var\(--divider-spacing\);/s);
	assert.match(source, /\.vertical \{[^}]*margin-inline: var\(--divider-spacing\);/s);
});

test('vertical dividers stretch to the flex parent cross size', () => {
	assert.match(source, /\.vertical \{[^}]*align-self: stretch;/s);
	assert.match(source, /\.vertical \{[^}]*width: 1px;/s);
	assert.match(source, /\.horizontal \{[^}]*height: 1px;/s);
});

test('tones map to the border tokens', () => {
	assert.match(source, /--divider-color: var\(--border\);/);
	assert.match(source, /\.tone-strong \{\s*--divider-color: var\(--border-strong\);/);
	assert.match(source, /\.tone-faint \{\s*--divider-color: color-mix\(/);
	assert.doesNotMatch(source, /#[0-9a-fA-F]{3,6}/);
});

test('a label splits the rule with pseudo-element halves', () => {
	assert.match(source, /class:labelled={!!children}/);
	assert.match(source, /<span class="divider-label">\{@render children\(\)\}<\/span>/);
	assert.match(source, /\.horizontal\.labelled::before,\s*\.horizontal\.labelled::after/);
	assert.match(source, /\.vertical\.labelled::before,\s*\.vertical\.labelled::after/);
});

test('Divider is exported and showcased', () => {
	assert.match(index, /export \{ default as Divider \} from '\.\/components\/atoms\/Divider\.svelte';/);
	assert.match(docs, /id: 'divider', label: 'Divider'/);
	assert.match(docs, /<section class="section" id="divider">/);
	assert.match(docs, /<Divider orientation="vertical"/);
});

test('Divider carries the kit component marker', () => {
	assert.match(source, /data-tsu="Divider"/);
});
