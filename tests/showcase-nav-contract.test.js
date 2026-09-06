import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../src/routes/+page.svelte', import.meta.url), 'utf8');
const reset = await readFile(new URL('../src/lib/styles/reset.css', import.meta.url), 'utf8');

const script = page.slice(0, page.indexOf('</script>'));
const navIds = [...script.matchAll(/\{ id: '([a-z-]+)', label: '[^']*', keywords:/g)].map((m) => m[1]);
const sectionIds = [...page.matchAll(/<section class="section" id="([a-z-]+)">/g)].map((m) => m[1]);

test('every showcase section has a nav entry, in the same order', () => {
	assert.ok(sectionIds.length >= 40);
	assert.deepEqual(navIds, sectionIds);
});

test('sections are wrapped in labelled thematic groups', () => {
	const groups = [...page.matchAll(/<section class="group" id="g-([a-z-]+)" aria-labelledby="gh-\1">/g)].map(
		(m) => m[1]
	);
	assert.deepEqual(groups, [
		'foundations',
		'layout',
		'actions',
		'forms',
		'navigation',
		'data',
		'feedback',
		'overlays'
	]);
	const navGroups = [...script.matchAll(/id: '([a-z-]+)',\n\t\t\tlabel: '/g)].map((m) => m[1]);
	assert.deepEqual(navGroups, groups);
});

test('the sidebar links every entry and tracks the active section', () => {
	assert.match(page, /href="#\{item\.id\}"/);
	assert.match(page, /class:active=\{active === item\.id\}/);
});

test('the scroll-spy marks the last section past the line, not the one filling a band', () => {
	assert.doesNotMatch(page, /new IntersectionObserver/);
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
