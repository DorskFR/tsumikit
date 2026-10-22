import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { readDemo } from './helpers/demo-source.js';

const page = await readDemo();
const scrollspy = await readFile(new URL('../src/demo/framework/scrollspy.svelte.ts', import.meta.url), 'utf8');
const reset = await readFile(new URL('../src/lib/styles/reset.css', import.meta.url), 'utf8');

test('nav entries and sections render from the same registry entries, in the same order', () => {
	assert.match(page, /\{#each entries as entry \(entry\.id\)\}\s*<DemoSection \{entry\}/);
	assert.match(page, /<section\s+bind:this=\{section\}\s+id=\{entry\.id\}\s+class="demo-section"\s+data-demo-section/);
	assert.match(page, /export const groups[^=]*= FAMILIES\.map\(\(family\) => \(\{\s*family,\s*entries: entries\.filter/);
});

test('the sidebar groups entries by family in labelled nav sections', () => {
	assert.match(page, /export const FAMILIES = \['foundations', 'atoms', 'molecules', 'organisms', 'layouts'\] as const;/);
	assert.match(page, /<NavSection label=\{FAMILY_LABEL\[group\.family\]\}>/);
});

test('the sidebar links every entry and tracks the active section', () => {
	assert.match(page, /href="#\{entry\.id\}"\s*active=\{active === entry\.id\}/);
});

test('the scroll-spy marks the last section past the line, not the one filling a band', () => {
	assert.doesNotMatch(scrollspy, /new IntersectionObserver/);
	assert.match(page, /if \(el\.getBoundingClientRect\(\)\.top > line\) break;/);
	assert.match(page, /window\.innerHeight \+ window\.scrollY >= document\.documentElement\.scrollHeight/);
});

test('the footer leaves scroll room so the last anchors can reach the header', () => {
	assert.match(page, /margin-top: max\(var\(--sp-6\), 60dvh\);/);
});

test('html and body clip sideways instead of hiding, so sticky chrome still sticks', () => {
	assert.doesNotMatch(reset, /overflow-x: hidden/);
	assert.equal([...reset.matchAll(/overflow-x: clip/g)].length, 2);
});
