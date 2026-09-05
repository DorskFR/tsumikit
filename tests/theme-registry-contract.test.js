import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} p */
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const [store, picker, pkg, readme, app, variables, tokens, themes, reset, utilities, syntax] =
	await Promise.all([
		read('src/lib/stores/theme.svelte.ts'),
		read('src/lib/components/molecules/ThemePicker.svelte'),
		read('package.json').then(JSON.parse),
		read('README.md'),
		read('src/lib/styles/app.css'),
		read('src/lib/styles/variables.css'),
		read('src/lib/styles/tokens.css'),
		read('src/lib/styles/themes.css'),
		read('src/lib/styles/reset.css'),
		read('src/lib/styles/utilities.css'),
		read('src/lib/styles/syntax.css')
	]);

const REQUIRED_THEME_TOKENS = [
	'--c-bg',
	'--c-bg-elev',
	'--c-bg-elev-2',
	'--c-surface',
	'--c-border',
	'--c-border-strong',
	'--c-text',
	'--c-text-muted',
	'--c-text-faint',
	'--c-accent',
	'--c-accent-ink',
	'--c-accent-dim',
	'--c-blue',
	'--c-amber',
	'--c-red',
	'--c-green',
	'--c-violet',
	'--c-gold',
	'--c-teal',
	'--shadow-sm',
	'--shadow-md',
	'--shadow-lg',
	'--mach-bg-sl',
	'--mach-fg-sl',
	'--mach-border-sl'
];

const builtins = [...store.matchAll(/\bid: '([a-z]+)'[^}]*mode: '(light|dark)'/g)].map((m) => ({ id: m[1], mode: m[2] }));
const blockIds = builtins.map((t) => t.id).filter((id) => id !== 'dark');
const themeBlocks = [...themes.matchAll(/\[data-theme="([a-z]+)"\]\s*{([^}]*)}/g)];

test('store exposes register/setDefault/all with an open ThemeDef and keeps THEMES + Mode', () => {
	assert.match(store, /export const THEMES = \[/);
	assert.match(store, /\] as const;/);
	assert.match(store, /export type Mode = \(typeof THEMES\)\[number\]\['id'\];/);
	assert.match(store, /export type ThemeId = Mode \| \(string & {}\);/);
	assert.match(
		store,
		/export interface ThemeDef {\s*id: ThemeId;\s*label: string;\s*mode: ThemeMode;\s*icon\?: string;\s*themeColor\?: string;\s*}/
	);
	assert.match(store, /register\(defs: ThemeDef \| ThemeDef\[\]\)/);
	assert.match(store, /setDefault\(id: ThemeId\)/);
	assert.match(store, /get all\(\): readonly ThemeDef\[\]/);
	assert.match(store, /set\(mode: ThemeId\)/);
	assert.match(store, /current = \$state<ThemeId>\('dark'\)/);
});

test('registered themes override built-ins by id and re-resolve the persisted theme', () => {
	assert.match(store, /for \(const t of THEMES\) byId\.set\(t\.id, t\);\s*for \(const t of this\.registered\) byId\.set\(t\.id, t\);/);
	assert.match(store, /register\([^)]*\) {[^}]*this\.resolve\(\);/s);
	assert.match(store, /setDefault\([^)]*\) {[^}]*this\.resolve\(\);/s);
	assert.match(
		store,
		/private resolve\(\) {\s*this\.current = this\.has\(this\.saved\) \? this\.saved : this\.fallback;\s*this\.apply\(\);/
	);
	assert.match(store, /const color = this\.option\.themeColor;\s*if \(color\)/);
});

test('ThemePicker lists theme.all (not the closed THEMES array) and tolerates a missing icon', () => {
	assert.doesNotMatch(picker, /THEMES/);
	assert.match(picker, /const groups = \$derived\(/);
	assert.match(picker, /\['light', 'dark'\] as const/);
	assert.match(picker, /theme\.all\.filter\(\(t\) => t\.mode === mode\)/);
	assert.match(picker, /t\.icon \?\? theme\.fallbackIcon/);
	assert.match(picker, /onclick=\{\(\) => theme\.set\(t\.id\)\}/);
});

test('app.css and variables.css are import shells over the layered files', () => {
	assert.deepEqual(
		[...app.matchAll(/@import '\.\/([a-z]+\.css)';/g)].map((m) => m[1]),
		['variables.css', 'reset.css', 'utilities.css', 'syntax.css']
	);
	assert.deepEqual(
		[...variables.matchAll(/@import '\.\/([a-z]+\.css)';/g)].map((m) => m[1]),
		['tokens.css', 'themes.css']
	);
	for (const shell of [app, variables]) assert.doesNotMatch(shell, /^[.:[a-z*][^\n]*{$/m);
});

test('tokens.css is theme-less and defines the semantic + font tokens the kit reads', () => {
	assert.doesNotMatch(tokens.replace(/\/\*[\s\S]*?\*\//g, ''), /\[data-theme/);
	assert.match(tokens, /^:root {/m);
	for (const t of ['--bg', '--text', '--accent', '--font-sans', '--font-mono', '--control-height', '--syn-keyword'])
		assert.match(tokens, new RegExp(`^  ${t}:`, 'm'), t);
	for (const t of REQUIRED_THEME_TOKENS) assert.match(tokens, new RegExp(`^  ${t}:`, 'm'), t);
});

test('themes.css has one block per built-in THEMES entry except the :root default, each honouring the contract', () => {
	assert.equal(builtins.length, 24);
	assert.deepEqual(themeBlocks.map((m) => m[1]).sort(), [...blockIds].sort());
	assert.doesNotMatch(themes, /^:root/m);
	assert.match(tokens, /^  color-scheme: dark;/m);
	for (const [, id, body] of themeBlocks) {
		if (builtins.find((t) => t.id === id)?.mode === 'light')
			assert.match(body, /color-scheme: light;/, `${id} color-scheme`);
		for (const t of REQUIRED_THEME_TOKENS) assert.match(body, new RegExp(`${t}:`), `${id} ${t}`);
	}
});

test('reset/utilities/syntax carry their former app.css sections', () => {
	assert.match(reset, /^\*,\s*\*::before,\s*\*::after {\s*box-sizing: border-box;/m);
	assert.match(reset, /^body {/m);
	assert.doesNotMatch(reset, /^\.container {/m);
	assert.match(utilities, /^\.container {/m);
	assert.match(utilities, /^\.sr-only {/m);
	assert.doesNotMatch(utilities, /hljs/);
	assert.match(syntax, /^\.hljs-keyword,/m);
	assert.match(syntax, /var\(--syn-keyword\)/);
	for (const part of [reset, utilities, syntax]) assert.doesNotMatch(part, /@import/);
});

test('package.json exports every stylesheet, keeping the old entries', () => {
	for (const f of ['app', 'variables', 'tokens', 'themes', 'reset', 'utilities', 'syntax'])
		assert.equal(pkg.exports[`./styles/${f}.css`], `./dist/styles/${f}.css`);
});

test('README documents the registration API and the consumer stylesheet contract', () => {
	const theming = readme.slice(readme.indexOf('## Theming'), readme.indexOf('## Components'));
	assert.match(theming, /theme\.register\(/);
	assert.match(theming, /theme\.setDefault\(/);
	assert.match(theming, /@dorsk\/tsumikit\/styles\/tokens\.css/);
	assert.match(theming, /@dorsk\/tsumikit\/styles\/themes\.css/);
	assert.match(theming, /\[data-theme='[a-z]+'\]/);
	for (const t of ['--c-bg', '--c-accent', '--shadow-sm', '--mach-bg-sl', 'color-scheme', '--font-mono'])
		assert.match(theming, new RegExp(t), t);
	assert.doesNotMatch(theming, /block in `variables\.css`/);
});
