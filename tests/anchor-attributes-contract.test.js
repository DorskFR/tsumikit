import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { compile, preprocess } from 'svelte/compiler';
import { normalize } from './helpers.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
const [tabs, filterInput, filterSearchBar, themePicker, anchor, index, readme] = await Promise.all([
	read('../src/lib/components/molecules/Tabs.svelte'),
	read('../src/lib/components/molecules/FilterInput.svelte'),
	read('../src/lib/components/organisms/FilterSearchBar.svelte'),
	read('../src/lib/components/molecules/ThemePicker.svelte'),
	read('../src/lib/anchor.ts'),
	read('../src/lib/index.ts'),
	read('../README.md')
]);

/** @param {string} src @param {string} filename */
async function client(src, filename) {
	const { code } = await preprocess(src, vitePreprocess(), { filename });
	return compile(code, { generate: 'client', filename }).js.code;
}

test('Tabs spreads rest onto its root, the element a tour anchors to', () => {
	assert.match(normalize(tabs), /\.\.\.rest \}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = \$props\(\);/);
	assert.match(normalize(tabs), /<div \{\.\.\.rest\} class="tabs \{klass\}"/);
});

test('each TabItem carries its own attrs bag, so a step can anchor to one tab', () => {
	assert.match(normalize(tabs), /attrs\?: import\('svelte\/elements'\)\.HTMLButtonAttributes;/);
	assert.match(normalize(tabs), /<button type="button" \{\.\.\.t\.attrs\}/);
});

test("a tab's own semantics land after its attrs and cannot be overridden", async () => {
	const js = await client(tabs, 'Tabs.svelte');
	const at = js.indexOf('...$.get(t).attrs');
	assert.ok(at > 0, 'the compiled tab does not spread its attrs');
	const after = js.slice(at);
	for (const key of ['role', 'aria-selected', 'aria-controls', 'id', 'tabindex', 'onclick']) {
		assert.match(after, new RegExp(`["']?${key}["']?:`), `${key} is not applied after the spread`);
	}
});

test('FilterInput spreads rest onto its root so FilterSearchBar has somewhere to forward', () => {
	assert.match(normalize(filterInput), /\.\.\.rest \}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = \$props\(\);/);
	assert.match(normalize(filterInput), /<div \{\.\.\.rest\} class="fi \{klass\}"/);
});

test('FilterSearchBar forwards its anchor bag onto FilterInput, first', () => {
	assert.match(normalize(filterSearchBar), /\.\.\.rest \}: AnchorAttributes & Own = \$props\(\);/);
	assert.match(normalize(filterSearchBar), /<FilterInput \{\.\.\.rest\} \{schema\}/);
});

test('ThemePicker forwards its anchor bag onto Popover, which lands it on the trigger', () => {
	assert.match(normalize(themePicker), /\.\.\.rest \}: AnchorAttributes & TriggerChrome & Own = \$props\(\);/);
	assert.match(normalize(themePicker), /<Popover \{\.\.\.rest\}/);
});

test('the wrappers take a data-only bag, which cannot collide with a child prop', () => {
	assert.match(anchor, /\[key: `data-\$\{string\}`\]: string \| number \| boolean \| null \| undefined;/);
	assert.doesNotMatch(anchor, /aria-|role|\bid\b\?/);
	assert.match(index, /export type \{ AnchorAttributes \} from '\.\/anchor';/);
});

test('none of the four changed their own defaults or semantics', () => {
	assert.match(normalize(tabs), /panelPadding = 'md',/);
	assert.match(normalize(tabs), /role="tablist"/);
	assert.match(normalize(filterInput), /data-tsu="FilterInput"/);
	assert.match(normalize(themePicker), /box = 'md',/);
	assert.match(normalize(themePicker), /placement = 'bottom-end',/);
	assert.match(normalize(filterSearchBar), /showChips = true,/);
});

test('the README points anchors at the public surface, not the private data-tsu marker', () => {
	assert.match(readme, /### Anchoring to a component/);
	assert.match(normalize(readme), /Never target the private `data-tsu="…"` markers/);
});
