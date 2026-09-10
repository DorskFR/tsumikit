import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/layouts/NavBar.svelte', import.meta.url),
	'utf8'
);
const index = await readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8');
const docs = await readFile(new URL('../src/routes/+page.svelte', import.meta.url), 'utf8');
const tokens = await readFile(new URL('../src/lib/styles/tokens.css', import.meta.url), 'utf8');

test('NavBarItem carries href, label, glyphs, badge and current', () => {
	assert.match(source, /export interface NavBarItem \{/);
	assert.match(source, /href: string;/);
	assert.match(source, /label: string;/);
	assert.match(source, /icon\?: IconName;/);
	assert.match(source, /emoji\?: string;/);
	assert.match(source, /badge\?: number \| string;/);
	assert.match(source, /current\?: boolean;/);
});

test('NavBar prop surface and defaults', () => {
	assert.match(source, /items: NavBarItem\[\];/);
	assert.match(source, /placement = 'inline'/);
	assert.match(source, /placement\?: 'bar' \| 'inline';/);
	assert.match(source, /orientation = 'stacked'/);
	assert.match(source, /orientation\?: 'stacked' \| 'inline';/);
	assert.match(source, /maxWidth\?: string;/);
	assert.match(source, /class: klass = ''/);
	assert.match(source, /style: styleProp = ''/);
});

test('NavBar is a nav landmark of links marking the current route', () => {
	assert.match(source, /<nav\b/);
	assert.match(source, /aria-label=\{label\}/);
	assert.match(source, /<a\s+href=\{item\.href\}/);
	assert.match(source, /aria-current=\{item\.current \? 'page' : undefined\}/);
	assert.doesNotMatch(source, /role="tab"|<button/);
});

test('badges skip the falsy counts and the emoji is decorative', () => {
	assert.match(
		source,
		/badge !== undefined && badge !== null && badge !== '' && badge !== 0/
	);
	assert.match(source, /class="navbar-emoji" aria-hidden="true"/);
});

test('bar placement reuses the existing z-index, nav-height and safe-area tokens', () => {
	assert.match(source, /\.bar \{[^}]*position: fixed;/s);
	assert.match(source, /z-index: var\(--z-nav\);/);
	assert.match(source, /padding-bottom: var\(--safe-bottom\);/);
	assert.match(source, /min-height: var\(--nav-h\);/);
	assert.match(tokens, /--z-nav: \d+;/);
	assert.match(tokens, /--safe-bottom: env\(safe-area-inset-bottom/);
	assert.match(tokens, /--nav-h: /);
});

test('maxWidth centres the row through a custom property', () => {
	assert.match(source, /--navbar-max: \$\{maxWidth\}/);
	assert.match(source, /max-width: var\(--navbar-max\);/);
	assert.match(source, /margin-inline: auto;/);
});

test('NavBar is exported and documented', () => {
	assert.match(
		index,
		/export \{ default as NavBar, type NavBarItem \} from '\.\/components\/layouts\/NavBar\.svelte';/
	);
	assert.match(docs, /\{ id: 'navbar', label: 'NavBar', keywords: '[^']*safe area[^']*' \}/);
	assert.match(docs, /<section class="section" id="navbar">/);
	assert.match(docs, /<NavBar items=\{navBarItems\} label="Demo sections" maxWidth="32rem" \/>/);
	assert.match(docs, /<NavBar items=\{navBarItems\} orientation="inline"/);
});
