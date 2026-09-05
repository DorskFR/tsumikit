import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [component, index, page] = await Promise.all([
	readFile(new URL('../src/lib/components/molecules/Fieldset.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8'),
	readFile(new URL('../src/routes/+page.svelte', import.meta.url), 'utf8')
]);

test('Fieldset is exported from the package index', () => {
	assert.match(index, /export { default as Fieldset } from '\.\/components\/molecules\/Fieldset\.svelte';/);
});

test('props: legend (string | snippet), tone, dashed, padding, droppable, accepts, ondrop, dropHint, bindable over', () => {
	assert.match(component, /legend\?: string \| Snippet;/);
	assert.match(component, /type Tone = 'accent' \| 'neutral' \| 'strong';/);
	assert.match(component, /tone = 'accent',/);
	assert.match(component, /dashed = true,/);
	assert.match(component, /padding\?: 'sm' \| 'md' \| 'lg';/);
	assert.match(component, /droppable = false,/);
	assert.match(component, /accepts\?: \(data: string, e: DragEvent\) => boolean;/);
	assert.match(component, /ondrop\?: \(data: string, e: DragEvent\) => void;/);
	assert.match(component, /dropHint\?: string \| Snippet;/);
	assert.match(component, /over = \$bindable\(false\),/);
	assert.match(component, /class: klass = '',/);
	assert.match(component, /style = '',/);
});

test('real fieldset/legend semantics; legend rides the top border', () => {
	assert.match(component, /<fieldset\s+class="fieldset fieldset-\{tone\} pad-\{padding\} \{klass\}"/);
	assert.match(component, /<legend class="fieldset-legend">/);
	assert.match(component, /\.fieldset\s*{[^}]*position: relative;/);
	assert.match(
		component,
		/\.fieldset-legend\s*{[^}]*position: absolute;[^}]*top: -13px;[^}]*left: 16px;[^}]*padding: 0 8px;[^}]*background: var\(--bg\);/
	);
});

test('dashed and tone variants map to border tokens', () => {
	assert.match(component, /class:dashed/);
	assert.match(component, /\.fieldset\.dashed\s*{\s*border-style: dashed;/);
	assert.match(component, /\.fieldset\s*{[^}]*--fieldset-border: var\(--accent-dim\);/);
	assert.match(component, /\.fieldset-neutral\s*{\s*--fieldset-border: var\(--border\);/);
	assert.match(component, /\.fieldset-strong\s*{\s*--fieldset-border: var\(--border-strong\);/);
	assert.match(component, /border-radius: var\(--r-lg\);/);
});

test('drop target: dragenter sets highlight, drop calls ondrop with payload, accepts=false ignores', () => {
	assert.match(component, /ondragenter={onDragEnter}\s+ondragleave={onDragLeave}\s+ondragover={onDragOver}\s+ondrop={onDrop}/);
	assert.match(component, /function valid\(e: DragEvent\): boolean {\s*if \(!droppable \|\| disabled\) return false;/);
	assert.match(component, /return accepts \? accepts\(payload\(e\), e\) : true;/);
	assert.match(component, /function onDragEnter\(e: DragEvent\) {\s*if \(!valid\(e\)\) return;[^}]*if \(depth === 1\) over = true;/);
	assert.match(component, /function onDrop\(e: DragEvent\) {[^}]*over = false;\s*if \(!valid\(e\)\) return;\s*e\.preventDefault\(\);\s*ondrop\?\.\(payload\(e\), e\);/);
	assert.match(component, /e\.dataTransfer\?\.getData\(mime\)/);
});

test('highlight style: accent dashed border with 6% fill and a drop hint row', () => {
	assert.match(component, /class:over/);
	assert.match(component, /\.fieldset\.over\s*{[^}]*--fieldset-border: var\(--accent\);[^}]*color-mix\(in srgb, var\(--accent\) 6%, var\(--bg\)\);/);
	assert.match(component, /{#if droppable && over && dropHint}\s*<div class="fieldset-hint" aria-live="polite">/);
});

test('reduced-motion disables the transition; no :global', () => {
	assert.match(component, /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.fieldset\s*{\s*transition: none;/);
	assert.doesNotMatch(component, /:global/);
});

test('demo: two droppable pools with a draggable card and a keyboard path', () => {
	assert.match(page, /<Fieldset\s+legend=/);
	assert.match(page, /droppable\s+accepts=/);
	assert.match(page, /draggable="true"/);
	assert.match(page, /movePool\(item, id === 'a' \? 'b' : 'a'\)/);
});
