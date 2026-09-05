import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/molecules/Drawer.svelte', import.meta.url),
	'utf8'
);
const wide = source.slice(source.indexOf('@media (min-width: 48rem) {'));
const narrow = source.slice(source.indexOf('<style>'), source.indexOf('@media (min-width: 48rem) {'));

test('Drawer is a native <dialog> that follows a bound `open` and closes on Escape, scrim click and the close button', () => {
	assert.match(source, /<dialog\s+bind:this={dialogEl}\s+data-tsu="Drawer"/);
	assert.match(source, /open = \$bindable\(\)/);
	assert.match(source, /const controlled = \$derived\(open !== undefined\);/);
	assert.match(source, /if \(open && !dialogEl\.open\) dialogEl\.showModal\(\);/);
	assert.match(source, /else if \(!open && dialogEl\.open\) dialogEl\.close\(\);/);
	assert.match(source, /function requestClose\(\) {\s*if \(controlled\) open = false;\s*onclose\?\.\(\);/s);
	assert.match(source, /oncancel={\(e\) => {\s*e\.preventDefault\(\);\s*requestClose\(\);/s);
	assert.match(source, /if \(e\.target === dialogEl\) requestClose\(\);/);
	assert.match(source, /<IconButton icon="x" label={closeLabel} onclick={requestClose} \/>/);
	assert.match(source, /closeLabel = 'Close panel'/);
});

test('Drawer locks body scroll while shown and restores it on close', () => {
	assert.match(source, /const shown = \$derived\(!controlled \|\| open === true\);/);
	assert.match(source, /if \(!browser \|\| !shown\) return;\s*const previous = document\.body\.style\.overflow;\s*document\.body\.style\.overflow = 'hidden';/s);
	assert.match(source, /document\.body\.style\.overflow = previous;/);
});

test('Drawer sides, width clamp and full-screen narrow layout', () => {
	assert.match(source, /side = 'right'/);
	assert.match(source, /side\?: 'left' \| 'right';/);
	assert.match(source, /width = '620px'/);
	assert.match(source, /style:--drawer-w={width}/);
	assert.match(source, /\.drawer\[data-side='left'\]\s*{\s*justify-content: flex-start;/s);
	assert.match(narrow, /\.panel\s*{[^}]*width: 100vw;[^}]*height: 100dvh;[^}]*background: var\(--bg-elevated\);/s);
	assert.match(wide, /\.panel\s*{[^}]*width: min\(var\(--drawer-w\), 100vw\);[^}]*border-left: 1px solid var\(--border-strong\);/s);
	assert.match(wide, /\.drawer\[data-side='left'\] \.panel\s*{[^}]*border-right: 1px solid var\(--border-strong\);/s);
	assert.match(source, /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.drawer::backdrop,\s*\.panel\s*{\s*animation: none;/s);
});

test('Drawer header, nav column and sticky footer slots', () => {
	assert.match(source, /header\?: Snippet;/);
	assert.match(source, /nav\?: Snippet;/);
	assert.match(source, /navMobile\?: Snippet;/);
	assert.match(source, /footer\?: Snippet;/);
	assert.match(source, /{#if header}\s*{@render header\(\)}\s*{:else}\s*<div class="panel-head">/s);
	assert.match(source, /<span id={titleId} class="panel-title truncate">{title}<\/span>/);
	assert.match(source, /{#if page}<span class="panel-page truncate">{page}<\/span>{\/if}/);
	assert.match(source, /<nav class="panel-nav" class:has-mobile={Boolean\(navMobile\)}>{@render nav\(\)}<\/nav>/);
	assert.match(source, /<nav class="panel-nav-mobile">{@render navMobile\(\)}<\/nav>/);
	assert.match(source, /<div class="panel-foot">{@render footer\(\)}<\/div>/);
	assert.match(source, /navWidth = '150px'/);
	assert.match(wide, /\.panel\.has-nav\s*{[^}]*grid-template-columns: var\(--drawer-nav-w\) minmax\(0, 1fr\);[^}]*'nav body'/s);
	assert.match(wide, /\.panel-nav-mobile\s*{\s*display: none;/s);
	assert.match(narrow, /\.panel-nav\.has-mobile\s*{\s*display: none;/s);
	assert.match(source, /\.panel-body\s*{[^}]*overflow-y: auto;/s);
	assert.match(source, /\.panel-foot\s*{[^}]*grid-area: foot;[^}]*justify-content: flex-end;/s);
});
