import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { readDemo } from './helpers/demo-source.js';

const page = await readDemo();
const reset = await readFile(new URL('../src/lib/styles/reset.css', import.meta.url), 'utf8');

test('nav and index render from the same registry groups', () => {
	assert.match(page, /export const groups[^=]*= FAMILIES\.map\(\(family\) => \(\{\s*family,\s*entries: entries\.filter/);
	assert.equal([...page.matchAll(/groups\s*\.map\(\(g\) => \(\{ \.\.\.g, entries: g\.entries\.filter\(\(e\) => demoFilter\.visible\.has\(e\.id\)\)/g)].length, 2);
});

test('the sidebar groups entries by family in labelled nav sections', () => {
	assert.match(page, /export const FAMILIES = \['foundations', 'atoms', 'molecules', 'organisms', 'layouts'\] as const;/);
	assert.match(page, /<NavSection label=\{FAMILY_LABEL\[group\.family\]\}>/);
});

test('the sidebar links every entry to its page and marks the current one', () => {
	assert.match(page, /href=\{pageOf\(entry\)\}\s*active=\{active === entry\.id\}/);
});

test('the footer leaves scroll room so the last anchors can reach the header', () => {
	assert.match(page, /margin-top: max\(var\(--sp-6\), 60dvh\);/);
});

test('html and body clip sideways instead of hiding, so sticky chrome still sticks', () => {
	assert.doesNotMatch(reset, /overflow-x: hidden/);
	assert.equal([...reset.matchAll(/overflow-x: clip/g)].length, 2);
});
