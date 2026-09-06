import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [autogrid, modal] = await Promise.all([
	readFile(new URL('../src/lib/components/layouts/AutoGrid.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/components/molecules/Modal.svelte', import.meta.url), 'utf8')
]);

test('AutoGrid lets a child claim several tracks via data-span', () => {
	for (const n of [2, 3, 4]) {
		assert.match(
			autogrid,
			new RegExp(`\\.autogrid-c > :global\\(\\[data-span='${n}'\\]\\)\\s*{\\s*grid-column: span ${n};`)
		);
	}
	assert.match(
		autogrid,
		/\.autogrid-c > :global\(\[data-span='full'\]\)\s*{\s*grid-column: 1 \/ -1;/
	);
});

test('the span hook is scoped to direct children, like Cluster data-grow', () => {
	assert.doesNotMatch(autogrid, /^\s*:global\(\[data-span/m);
});

test('Modal footerFill stretches the footer content instead of hugging the right edge', () => {
	assert.match(modal, /footerFill = false/);
	assert.match(modal, /footerFill\?: boolean/);
	assert.match(modal, /class="sheet-foot" class:foot-fill={footerFill}/);
	assert.match(modal, /\.sheet-foot\.foot-fill > :global\(\*\)\s*{\s*flex: 1;/);
});

test('the default footer is untouched: a right-aligned flex row', () => {
	assert.match(modal, /\.sheet-foot\s*{[^}]*display: flex;/);
	assert.match(modal, /\.sheet-foot\s*{[^}]*justify-content: flex-end;/);
	assert.doesNotMatch(modal, /\.sheet-foot\s*{[^}]*flex: 1;/);
});
