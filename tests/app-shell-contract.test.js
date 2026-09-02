import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/layouts/AppShell.svelte', import.meta.url),
	'utf8'
);
const desktop = source.slice(source.indexOf('@media (min-width: 48rem) {'));

test('defaults keep the header-top layout, relative sidebar and --sp-3 padding', () => {
	assert.match(source, /layout = 'header-top'/);
	assert.match(source, /stickySidebar = false/);
	assert.match(source, /sidebarPadding = 'md'/);
	assert.match(source, /layout\?: 'header-top' \| 'sidebar-full'/);
	assert.match(source, /sidebarPadding\?: 'none' \| 'sm' \| 'md'/);
	assert.match(desktop, /\.shell\s*{[^}]*'header header'\s*'sidebar main'\s*'footer footer'/s);
	assert.match(desktop, /\.shell-sidebar\s*{[^}]*position: relative;/s);
	assert.match(source, /\.shell-sidebar\s*{[^}]*--shell-sidebar-pad: var\(--sp-3\);/s);
});

test('layout="sidebar-full" re-areas the ≥48rem grid so the sidebar spans header, main and footer', () => {
	assert.match(source, /class:sidebar-full={layout === 'sidebar-full'}/);
	assert.match(
		desktop,
		/\.shell\.sidebar-full\s*{[^}]*'sidebar header'\s*'sidebar main'\s*'sidebar footer'/s
	);
	assert.doesNotMatch(source.slice(0, source.indexOf('@media')), /\.shell\.sidebar-full/);
});

test('stickySidebar pins the desktop aside to the viewport while the resize handle stays absolute', () => {
	assert.match(source, /class:sticky-sidebar={stickySidebar}/);
	assert.match(
		desktop,
		/\.shell\.sticky-sidebar \.shell-sidebar\s*{[^}]*position: sticky;[^}]*top: 0;[^}]*height: 100dvh;[^}]*align-self: start;/s
	);
	assert.match(desktop, /\.shell-sidebar-resize\s*{[^}]*position: absolute;/s);
});

test('sidebarPadding drives one custom property used by all three padding declarations', () => {
	assert.match(source, /data-padding={sidebarPadding}/);
	assert.match(source, /padding: var\(--shell-sidebar-pad\);/);
	assert.match(source, /padding-top: max\(var\(--shell-sidebar-pad\), var\(--safe-top\)\);/);
	assert.match(source, /padding-bottom: max\(var\(--shell-sidebar-pad\), var\(--safe-bottom\)\);/);
	assert.match(source, /\.shell-sidebar\[data-padding='sm'\]\s*{\s*--shell-sidebar-pad: var\(--sp-2\);/);
	assert.match(source, /\.shell-sidebar\[data-padding='none'\]\s*{\s*--shell-sidebar-pad: 0px;/);
});

test('header and its children can shrink so a wide title/actions cluster never widens the grid', () => {
	assert.match(source, /\.shell-header\s*{[^}]*min-width: 0;/s);
	assert.match(source, /\.shell-header > :global\(\*\)\s*{\s*min-width: 0;/);
	assert.match(source, /\.shell\s*{[^}]*grid-template-columns: minmax\(0, 1fr\);/s);
});

test('tablet icon-rail band is intact', () => {
	assert.match(
		source,
		/@media \(min-width: 48rem\) and \(max-width: 63\.999rem\)\s*{\s*\.shell\s*{\s*grid-template-columns: var\(--shell-rail-w, 4\.5rem\) minmax\(0, 1fr\);/
	);
});
