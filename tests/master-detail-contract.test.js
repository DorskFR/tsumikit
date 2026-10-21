import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/layouts/MasterDetail.svelte', import.meta.url),
	'utf8'
);
const markup = source.slice(source.indexOf('</script>'), source.indexOf('<style>'));
const css = source.slice(source.indexOf('<style>'));

test('props default to a 17rem list, 48rem own-width breakpoint, nothing selected', () => {
	assert.match(source, /listWidth = '17rem'/);
	assert.match(source, /breakpoint = '48rem'/);
	assert.match(source, /selected = false/);
	assert.match(source, /gap = '0'/);
	assert.match(source, /divider = 'border'/);
	assert.match(source, /backLabel = 'Back'/);
	assert.match(source, /onback\?: \(\) => void/);
	assert.match(source, /new ResizeObserver/);
	assert.match(source, /mobile = entry\.contentRect\.width < limit/);
	assert.doesNotMatch(source, /matchMedia/);
});

test('desktop shows both panes; mobile shows exactly the pane selected dictates, keeping both mounted', () => {
	assert.match(source, /const showList = \$derived\(!mobile \|\| !selected\)/);
	assert.match(source, /const showDetail = \$derived\(!mobile \|\| selected\)/);
	assert.match(markup, /<aside bind:this={listEl} class="md-list" aria-label={listLabel} hidden={!showList}>/);
	assert.match(markup, /<section class="md-detail" hidden={!showDetail}>/);
	assert.doesNotMatch(markup, /{#if show(List|Detail)}/);
	assert.match(css, /\.md-detail\[hidden\]\s*{\s*display: none;\s*}/);
	assert.match(markup, /{#if selected}\s*{@render detail\(\)}\s*{:else}\s*{@render empty\?\.\(\)}/);
});

test('back button exists only on mobile, calls onback, and sits in a sticky touch-sized header', () => {
	assert.match(
		markup,
		/{#if mobile}\s*<header class="md-detail-header">\s*<button bind:this={backEl} type="button" class="md-back" onclick={\(\) => onback\?\.\(\)}>/
	);
	assert.match(markup, /{:else if detailHeader}\s*<header class="md-detail-header">/);
	assert.doesNotMatch(markup.slice(markup.indexOf('{:else if detailHeader}')), /md-back/);
	assert.match(css, /\.md-detail-header\s*{[^}]*position: sticky;[^}]*top: 0;[^}]*min-height: var\(--touch-target\);/s);
	assert.match(css, /\.md-back\s*{[^}]*min-height: var\(--touch-target\);[^}]*min-width: var\(--touch-target\);/s);
});

test('columns scroll independently with a --border divider; mobile panes are full-width with safe-area padding', () => {
	assert.match(css, /\.md\s*{[^}]*grid-template-columns: var\(--md-list-w\) minmax\(0, 1fr\);[^}]*overflow: hidden;/s);
	assert.match(css, /\.md-list,\s*\.md-detail\s*{[^}]*overflow-y: auto;[^}]*overflow-x: hidden;/s);
	assert.match(css, /\.md-list\s*{\s*border-right: var\(--md-divider, 1px solid var\(--border\)\);/);
	assert.match(css, /\.md\.mobile\s*{\s*grid-template-columns: minmax\(0, 1fr\);/);
	assert.match(css, /\.md\.mobile \.md-list\s*{[^}]*width: 100%;[^}]*padding-inline: var\(--safe-left\) var\(--safe-right\);/s);
	assert.match(css, /\.md\.mobile \.md-detail-header\s*{[^}]*max\(var\(--sp-3\), var\(--safe-left\)\) max\(var\(--sp-3\), var\(--safe-right\)\)/s);
	assert.match(css, /\.md\.mobile \.md-detail-body\s*{[^}]*padding-bottom: var\(--safe-bottom\);/s);
});

test('mobile detail slides in on translate and opacity from tokens, exits faster, and no :global leaks', () => {
	assert.match(css, /\.md\.mobile \.md-detail\s*{[^}]*translate var\(--dur-base\) var\(--ease-out\)/s);
	assert.match(css, /@starting-style\s*{\s*\.md\.mobile \.md-detail\s*{\s*translate: var\(--shift-md\) 0;\s*opacity: 0;/);
	assert.match(css, /\.md\.mobile \.md-detail\[hidden\]\s*{[^}]*transition-duration: var\(--dur-exit\);/s);
	assert.doesNotMatch(css, /@keyframes|prefers-reduced-motion/);
	assert.doesNotMatch(source, /:global/);
});

test('gap and divider ship as overridable custom properties on the root', () => {
	assert.match(markup, /--md-gap: {gap};/);
	assert.match(markup, /--md-divider: {divider === 'none'\s*\?\s*'none'\s*:\s*'1px solid var\(--border\)'};/);
	assert.match(css, /\.md\s*{[^}]*gap: var\(--md-gap, 0\);/s);
	assert.match(css, /\.md\.mobile\s*{[^}]*gap: 0;/s);
});
