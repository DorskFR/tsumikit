import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} p */
const read = (p) => readFile(new URL(`../src/${p}`, import.meta.url), 'utf8');

const [select, index, page] = await Promise.all([
	read('lib/components/atoms/Select.svelte'),
	read('lib/index.ts'),
	read('routes/+page.svelte')
]);

test('Select exposes an options array typed with icon/emoji/hint/disabled', () => {
	assert.match(select, /export type SelectOption = {[^}]*icon\?: IconName;[^}]*emoji\?: string;[^}]*hint\?: string;[^}]*disabled\?: boolean;/s);
	assert.match(select, /options\?: SelectOption\[\];/);
	assert.match(index, /export type { SelectOption } from '\.\/components\/atoms\/Select\.svelte';/);
});

test('options render native <option>s with emoji + hint folded into the text, disabled passed through', () => {
	assert.match(select, /<option value={o\.value} disabled={o\.disabled}>{optionText\(o\)}<\/option>/);
	assert.match(select, /\[o\.emoji, o\.label, o\.hint && `· \${o\.hint}`\]\.filter\(Boolean\)\.join\(' '\)/);
});

test('children remain the option source when options is absent, in every variant', () => {
	assert.match(select, /{#if options}[\s\S]*{:else}\s*{@render children\?\.\(\)}\s*{\/if}\s*{\/snippet}/);
	assert.equal((select.match(/{@render optionList\(\)}/g) ?? []).length, 2);
});

test('trigger face shows the selected option icon/emoji, label and muted right-aligned hint', () => {
	assert.match(select, /const selected = \$derived\(options\?\.find\(\(o\) => o\.value === value\)\)/);
	assert.match(select, /const hasFace = \$derived\(!!options && variant !== 'ghost'\)/);
	assert.match(select, /<span class="select-face" class:compact={small} aria-hidden="true">/);
	assert.match(select, /{#if selected\?\.icon}\s*<Icon name={selected\.icon}/);
	assert.match(select, /{:else if selected\?\.emoji}\s*<span class="select-emoji">{selected\.emoji}<\/span>/);
	assert.match(select, /{#if selected\?\.hint}\s*<span class="select-hint">{selected\.hint}<\/span>/);
	assert.match(select, /\.select-hint\s*{[^}]*margin-left: auto;[^}]*color: var\(--text-muted\);/s);
	assert.match(select, /\.select-face\s*{[^}]*pointer-events: none;/s);
});

test('native text hides under the face without bleeding into the popup', () => {
	assert.match(select, /class:has-face={hasFace}/);
	assert.match(select, /\.select\.has-face\s*{\s*color: transparent;\s*}/);
	assert.match(select, /\.select\.has-face option\s*{[^}]*color: var\(--text\);/s);
});

test('demo shows emoji, icon and hint options', () => {
	assert.match(page, /options={\[[\s\S]*emoji: '🐼', hint: '62%'[\s\S]*icon: 'users', hint: '18%'[\s\S]*disabled: true[\s\S]*\]}/);
});
