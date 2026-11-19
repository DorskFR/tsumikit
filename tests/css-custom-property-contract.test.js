import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { readDocs } from './helpers.mjs';

const root = new URL('../', import.meta.url);
const styling = await readDocs('styling.md');
const migration = await readDocs('MIGRATION-0.94.md');

const PAGES = ['styling.md', 'components.md', 'layout.md', 'patterns.md', 'theming.md', 'design.md', 'accessibility.md'];
/** @type {Map<string, string>} */
const pages = new Map();
for (const page of PAGES) pages.set(`docs/${page}`, await readDocs(page));
pages.set('README.md', await readFile(new URL('README.md', root), 'utf8'));

const tokens = new Set();
for (const file of ['tokens.css', 'themes.css']) {
	const css = await readFile(new URL(`src/lib/styles/${file}`, root), 'utf8');
	for (const m of css.matchAll(/(--[a-zA-Z][\w-]*)\s*:/g)) tokens.add(m[1]);
}

const SIGNALS = [
	'--tabbar-h',
	'--selectionbar-h',
	'--section-header-h',
	'--toaster-offset',
	'--toaster-offset-top',
	'--sticky-offset',
	'--fs-scale'
];
const CONSUMER_OWNED = ['--player-h', '--dock-left-w', '--dock-right-w', '--shiki-'];

const isToken = (/** @type {string} */ name) => tokens.has(name) || (name.endsWith('-') && [...tokens].some((t) => t.startsWith(name)));

async function librarySource() {
	/** @type {string[]} */
	const out = [];
	/** @param {URL} dir */
	async function walk(dir) {
		for (const entry of await readdir(dir, { withFileTypes: true })) {
			if (entry.isDirectory()) await walk(new URL(`${entry.name}/`, dir));
			else if (/\.(svelte|ts|js|css)$/.test(entry.name)) out.push(await readFile(new URL(entry.name, dir), 'utf8'));
		}
	}
	await walk(new URL('src/lib/', root));
	return out.join('\n');
}

test('the docs name no custom property that is not a root token or a page-layout signal', () => {
	/** @type {string[]} */
	const unknown = [];
	for (const [page, text] of pages) {
		text.split('\n').forEach((line, i) => {
			if (/^\s*(npx|npm|node|rg|git)\b/.test(line)) return;
			for (const m of line.matchAll(/(?<![\w-])--[a-z][\w]*(?:-[\w]+)*-?/g)) {
				const name = m[0];
				if (isToken(name) || SIGNALS.includes(name) || CONSUMER_OWNED.includes(name)) continue;
				unknown.push(`${page}:${i + 1} ${name}`);
			}
		});
	}
	assert.deepEqual(unknown, []);
});

test('docs/styling.md publishes no per-component property table and points at the migration', () => {
	assert.doesNotMatch(styling, /\| component \| published properties \|/);
	assert.doesNotMatch(styling, /style="--/);
	assert.match(styling, /reads no\s+per-component custom property/);
	assert.match(styling, /\[MIGRATION-0\.94\.md\]\(MIGRATION-0\.94\.md\)/);
});

test('every page-layout signal the docs list is one the library writes or reads', async () => {
	const table = styling.match(/\| page-layout signal \|[^\n]*\n\|[^\n]*\|\n((?:\|[^\n]*\|\n)+)/);
	assert.ok(table, 'docs/styling.md is missing the page-layout signal table');
	const listed = [...table[1].matchAll(/`(--[a-z-]+)`/g)].map((m) => m[1]).filter((name) => !tokens.has(name));
	assert.deepEqual([...new Set(listed)].sort(), SIGNALS.filter((name) => !tokens.has(name)).sort());
	const source = await librarySource();
	for (const name of SIGNALS) assert.ok(source.includes(name), `${name} is not used by the library`);
});

test('the migration names every prop that replaced a hook', () => {
	for (const prop of [
		'Button size="xl"',
		'Badge variant="solid"',
		'Toggle tone',
		'OptionButton tone',
		'Disclosure flush',
		'Drawer flush',
		'Toaster position',
		'NavBar centerWidth',
		'Tabs tabMaxWidth',
		'Skeleton phase'
	]) {
		assert.ok(migration.includes(prop), `MIGRATION-0.94.md does not mention ${prop}`);
	}
});

test('the docs state that reaching into internals with :global() is unsupported', () => {
	assert.match(styling, /`:global\(\)` into kit internals is unsupported/);
	assert.match(styling, /private and change without a major/);
});
