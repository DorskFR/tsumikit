import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
	AUTO_THEME,
	chooseTheme,
	DEFAULT_THEME_PREFERENCE,
	pickerValue,
	preferenceFrom,
	resolveTheme
} from '../src/lib/theme-mode.ts';

/** @param {string} p */
const read = (p) => readFile(new URL(`../src/${p}`, import.meta.url), 'utf8');
const [store, picker, index] = await Promise.all([
	read('lib/stores/theme.svelte.ts'),
	read('lib/components/molecules/ThemePicker.svelte'),
	read('lib/index.ts')
]);

const LIGHT = new Set(['light', 'sepia', 'latte']);
const DARK = new Set(['dark', 'mocha', 'nord']);
/** @type {import('../src/lib/theme-mode.ts').SlotOf} */
const slotOf = (id) => (LIGHT.has(id) ? 'light' : DARK.has(id) ? 'dark' : null);

/** @type {import('../src/lib/theme-mode.ts').ThemePreference} */
const pref = { mode: 'auto', light: 'sepia', dark: 'mocha' };

test('auto resolves through the system scheme; a pinned mode ignores it', () => {
	assert.equal(resolveTheme(pref, true), 'mocha');
	assert.equal(resolveTheme(pref, false), 'sepia');
	assert.equal(resolveTheme({ ...pref, mode: 'light' }, true), 'sepia');
	assert.equal(resolveTheme({ ...pref, mode: 'dark' }, false), 'mocha');
});

test('choosing a theme pins its slot and becomes that slot memory', () => {
	assert.deepEqual(chooseTheme(pref, 'latte', slotOf), { mode: 'light', light: 'latte', dark: 'mocha' });
	assert.deepEqual(chooseTheme(pref, 'nord', slotOf), { mode: 'dark', light: 'sepia', dark: 'nord' });
});

test('choosing auto keeps both memories, and an unknown id changes nothing', () => {
	assert.deepEqual(chooseTheme({ ...pref, mode: 'dark' }, AUTO_THEME, slotOf), pref);
	assert.equal(chooseTheme(pref, 'nope', slotOf), pref);
});

test('preferenceFrom reads the three persisted fields', () => {
	assert.deepEqual(preferenceFrom({ themeMode: 'auto', lightTheme: 'latte', darkTheme: 'nord' }, slotOf), {
		mode: 'auto',
		light: 'latte',
		dark: 'nord'
	});
});

test('a legacy lone theme id migrates by pinning its own slot', () => {
	assert.deepEqual(preferenceFrom({ theme: 'sepia' }, slotOf), {
		mode: 'light',
		light: 'sepia',
		dark: 'dark'
	});
	assert.deepEqual(preferenceFrom({ theme: 'nord' }, slotOf), {
		mode: 'dark',
		light: 'light',
		dark: 'nord'
	});
});

test('a legacy id that is not a registered theme falls back instead of being trusted', () => {
	assert.deepEqual(preferenceFrom({ theme: 'gone' }, slotOf), DEFAULT_THEME_PREFERENCE);
});

test('slot memories of the wrong kind or unknown fall back to the given defaults', () => {
	assert.deepEqual(preferenceFrom({ themeMode: 'light', lightTheme: 'mocha', darkTheme: 'gone' }, slotOf), {
		mode: 'light',
		light: 'light',
		dark: 'dark'
	});
	/** @type {import('../src/lib/theme-mode.ts').ThemePreference} */
	const seed = { mode: 'dark', light: 'latte', dark: 'nord' };
	assert.deepEqual(preferenceFrom({ lightTheme: 'gone' }, slotOf, seed), seed);
	assert.deepEqual(preferenceFrom({}, slotOf), DEFAULT_THEME_PREFERENCE);
});

test('pickerValue is auto in auto mode, else the pinned slot theme', () => {
	assert.equal(pickerValue(pref), AUTO_THEME);
	assert.equal(pickerValue({ ...pref, mode: 'light' }), 'sepia');
	assert.equal(pickerValue({ ...pref, mode: 'dark' }), 'mocha');
});

test('the store owns the system listener, the preference and its persistence', () => {
	assert.match(store, /const SCHEME_QUERY = '\(prefers-color-scheme: dark\)';/);
	assert.match(store, /mq\?\.addEventListener\?\.\('change', \(e\) => {\s*this\.systemDark = e\.matches;\s*this\.paint\(\);/);
	assert.match(store, /pref = \$state<ThemePreference>\(DEFAULT_THEME_PREFERENCE\);/);
	assert.match(store, /get resolved\(\): ThemeId {\s*return resolveTheme\(this\.pref, this\.systemDark\);/);
	assert.match(store, /choose\(choice: string\): ThemePreference/);
	assert.match(store, /hydrate\(pref: ThemePreference\)/);
	assert.match(store, /onchange\?: \(pref: ThemePreference\) => void;/);
});

test('a stored blob and a stored bare id both go through preferenceFrom', () => {
	assert.match(store, /const KEY = 'tsumikit-theme';/);
	assert.match(store, /localStorage\.setItem\(KEY, this\.saved\)/);
	assert.match(store, /JSON\.stringify\(this\.pref\)/);
	assert.match(store, /blob\s*\?\s*{ themeMode: blob\.mode, lightTheme: blob\.light, darkTheme: blob\.dark }\s*:\s*{ theme: this\.saved }/);
});

test('hydrate replays a preference without echoing it back through onchange', () => {
	const body = store.slice(store.indexOf('hydrate(pref: ThemePreference)'));
	const end = body.indexOf('\n\t}');
	assert.doesNotMatch(body.slice(0, end), /persist\(\)|onchange/);
});

test('ThemePicker grew an auto row instead of being forked', () => {
	assert.match(picker, /auto = false,/);
	assert.match(picker, /autoLabel = 'Auto',/);
	assert.match(picker, /autoHelp = /);
	assert.match(picker, /lightLabel = 'Light',\s*darkLabel = 'Dark',/);
	assert.match(picker, /{#if auto}[\s\S]*class="auto"/);
	assert.match(picker, /class:remembered={isAuto && t\.id === theme\.pref\[g\.mode\]}/);
	assert.match(picker, /\.cell\.remembered\s*{[^}]*border-style: dashed;/s);
	assert.doesNotMatch(picker, /{g\.mode}/);
});

test('the theme-mode API is exported from the barrel', () => {
	for (const name of ['AUTO_THEME', 'chooseTheme', 'preferenceFrom', 'resolveTheme', 'pickerValue'])
		assert.match(index, new RegExp(`\\b${name},`), name);
	assert.match(index, /} from '\.\/theme-mode';/);
});
