import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [component, index] = await Promise.all([
	readFile(new URL('../src/lib/components/organisms/DataTable.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8')
]);

test('DataTable and its Column type stay exported', () => {
	assert.match(index, /type Column,\s+default as DataTable,\s+type RowTone/);
	assert.match(component, /export interface Column<T> {/);
	assert.match(component, /export type RowTone = 'neutral' \| 'ok' \| 'warn' \| 'danger' \| 'info'/);
});

test('existing props keep their defaults', () => {
	assert.match(component, /cellSnippets = {}/);
	assert.match(component, /empty = 'No data\.'/);
	assert.match(component, /stickyHeader = false/);
	assert.match(component, /layout = 'auto'/);
	assert.match(component, /hideHeader = false/);
	assert.match(component, /size = 'md'/);
	assert.match(component, /loading = false/);
	assert.match(component, /top: var\(--dt-sticky-offset, 0\)/);
});

test('layout prop drives table-layout', () => {
	assert.match(component, /layout\?: 'auto' \| 'fixed'/);
	assert.match(component, /class:fixed={layout === 'fixed'}/);
	assert.match(component, /\.dt\.fixed\s*{\s*table-layout: fixed;/);
});

test('hideHeader keeps the thead in the DOM and clips it instead of removing it', () => {
	assert.match(component, /class:head-hidden={hideHeader}/);
	assert.match(component, /<thead data-part="head">/);
	assert.doesNotMatch(component, /{#if !hideHeader}\s*<thead/);
	assert.match(component, /\.dt\.head-hidden th\s*{[^}]*clip-path: inset\(50%\);/);
	assert.doesNotMatch(component, /\.dt\.head-hidden[^{]*{[^}]*display: none/);
});

test('Column gains truncate, nowrap and hideBelow', () => {
	assert.match(component, /truncate\?: boolean/);
	assert.match(component, /nowrap\?: boolean/);
	assert.match(component, /hideBelow\?: 'sm' \| 'md' \| 'lg'/);
	assert.match(component, /class:truncate={col\.truncate}/);
	assert.match(component, /class:nowrap={col\.nowrap}/);
	assert.match(
		component,
		/td\.truncate\s*{\s*white-space: nowrap;\s*overflow: hidden;\s*text-overflow: ellipsis;\s*max-width: 0;/
	);
});

test('hideBelow uses container queries against the table box, on both th and td', () => {
	assert.match(component, /\.dt-scroll\s*{[^}]*container-type: inline-size;/);
	assert.match(component, /<th[^>]*data-hide-below={col\.hideBelow}/);
	assert.match(component, /<td[^>]*data-hide-below={col\.hideBelow}/);
	assert.match(component, /@container \(max-width: 30rem\)\s*{\s*\[data-hide-below='sm'\]\s*{\s*display: none;/);
	assert.match(component, /@container \(max-width: 48rem\)\s*{\s*\[data-hide-below='md'\]/);
	assert.match(component, /@container \(max-width: 64rem\)\s*{\s*\[data-hide-below='lg'\]/);
});

test('rowTone renders data-tone + accent bar; rowClass is the escape hatch', () => {
	assert.match(component, /rowTone\?: \(row: T\) => RowTone \| undefined/);
	assert.match(component, /rowClass\?: \(row: T\) => string \| undefined/);
	assert.match(component, /{@const tone = rowTone\?\.\(row\)}/);
	assert.match(component, /data-tone={tone}/);
	assert.match(component, /class={rowClass\?\.\(row\)}/);
	for (const tone of ['ok', 'warn', 'danger', 'info']) {
		assert.match(component, new RegExp(`tr\\[data-tone='${tone}'\\]\\s*{\\s*--dt-tone: var\\(--${tone}\\);`));
	}
	assert.match(component, /tr\.toned td:first-child\s*{\s*box-shadow: inset 3px 0 0 var\(--dt-tone\);/);
});

test('rowActions is a trailing cell with a labelled header, hover-revealed, visible on touch', () => {
	assert.match(component, /rowActions\?: Snippet<\[T\]>/);
	assert.match(component, /rowActionsLabel = 'Actions'/);
	assert.match(component, /<th scope="col" class="dt-actions-head"><span class="sr-only">{rowActionsLabel}<\/span><\/th>/);
	assert.match(component, /<td data-part="actions" class="dt-actions">\s*{@render rowActions\(row\)}/);
	assert.match(component, /const colCount = \$derived\(columns\.length \+ \(rowActions \? 1 : 0\)\)/);
	assert.match(component, /colspan={colCount}/);
	assert.match(component, /\.dt-actions\s*{\s*opacity: 0;/);
	assert.match(component, /tr:hover \.dt-actions,\s*tr:focus-within \.dt-actions\s*{\s*opacity: 1;/);
	assert.match(component, /@media \(pointer: coarse\)\s*{\s*\.dt-actions\s*{\s*opacity: 1;/);
});

test('stickyOffset feeds the sticky header top via a CSS variable', () => {
	assert.match(component, /stickyOffset\?: string/);
	assert.match(component, /style:--dt-sticky-offset={stickyOffset}/);
	assert.match(component, /\.dt\.sticky th\s*{\s*position: sticky;\s*top: var\(--dt-sticky-offset, 0\);/);
});

test('size="sm" tightens type and padding', () => {
	assert.match(component, /size\?: 'sm' \| 'md'/);
	assert.match(component, /class:sm={size === 'sm'}/);
	assert.match(component, /\.dt\.sm\s*{\s*font-size: var\(--fs-xs\);/);
	assert.match(component, /\.dt\.sm th,\s*\.dt\.sm td\s*{\s*padding: var\(--sp-1\) var\(--sp-2\);/);
});

test('stable data-part hooks on head, row and cell', () => {
	assert.match(component, /data-tsu="DataTable"/);
	assert.match(component, /<thead data-part="head">/);
	assert.match(component, /<tr\s+data-part="row"/);
	assert.match(component, /<td\s+data-part="cell"/);
});

test('empty accepts a string or a snippet; loading and onloadmore render rows/footer', () => {
	assert.match(component, /empty\?: string \| Snippet/);
	assert.match(component, /{#if typeof empty === 'string'}\s*{empty}\s*{:else}\s*{@render empty\(\)}/);
	assert.match(component, /aria-busy={loading \|\| undefined}/);
	assert.match(component, /{#if sortedRows\.length === 0 && !loading}/);
	assert.match(component, /<tr data-part="loading">/);
	assert.match(component, /onloadmore\?: \(\) => void/);
	assert.match(component, /{#if onloadmore && !loading}\s*<tfoot>/);
	assert.match(component, /<button type="button" class="dt-more-btn" onclick={onloadmore}>{loadMoreLabel}<\/button>/);
});

test('semantics kept: real table, th scope, keyboard-operable sort and rows', () => {
	assert.match(component, /<table\s/);
	assert.match(component, /<th\s+scope="col"/);
	assert.match(component, /<button type="button" class="dt-sort" onclick={\(\) => toggleSort\(col\)}>/);
	assert.match(component, /aria-sort={col\.sortable/);
	assert.match(component, /role={onrowclick \? 'button' : undefined}/);
	assert.match(component, /e\.key === 'Enter' \|\| e\.key === ' '/);
});

test('fixed layout gives the actions column a definite width so it never overflows the scroll wrapper', () => {
	assert.match(component, /\.dt\.fixed \.dt-actions-head,\s*\.dt\.fixed \.dt-actions\s*{\s*width: var\(--dt-actions-w, 3\.5rem\);/s);
});
