import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { EMOJI_GROUPS, searchEmoji } from '../src/lib/emoji.ts';

/** @param {string} p */
const read = (p) => readFile(new URL(`../src/${p}`, import.meta.url), 'utf8');
const [picker, index, page] = await Promise.all([
	read('lib/components/molecules/EmojiPicker.svelte'),
	read('lib/index.ts'),
	read('routes/+page.svelte')
]);

const entries = EMOJI_GROUPS.flatMap((g) => g.entries);

test('every group carries an id, a tab glyph, a human label and entries', () => {
	assert.ok(EMOJI_GROUPS.length >= 6);
	for (const g of EMOJI_GROUPS) {
		assert.match(g.id, /^[a-z]+$/);
		assert.ok(g.icon.length > 0, g.id);
		assert.ok(g.label.length > 0 && g.label !== g.id, `${g.id} needs a human label`);
		assert.ok(g.entries.length > 0, g.id);
	}
});

test('the catalogue has no duplicate glyph and every entry has keywords', () => {
	assert.equal(new Set(entries.map((x) => x.emoji)).size, entries.length);
	for (const x of entries) assert.ok(x.keys.trim().length > 0, x.emoji);
});

test('searchEmoji is empty for a blank query', () => {
	assert.deepEqual(searchEmoji('  '), []);
});

test('searchEmoji matches EN and FR keywords, accent-insensitively', () => {
	assert.deepEqual(searchEmoji('crabe').map((x) => x.emoji), ['🦀']);
	assert.deepEqual(searchEmoji('elephant').map((x) => x.emoji), ['🐘']);
	assert.deepEqual(searchEmoji('Éléphant').map((x) => x.emoji), ['🐘']);
});

test('searchEmoji requires every word to match, in any order', () => {
	assert.deepEqual(searchEmoji('heart blue').map((x) => x.emoji), ['💙']);
	assert.deepEqual(searchEmoji('blue heart').map((x) => x.emoji), ['💙']);
});

test('searchEmoji searches the groups it is given, not the default catalogue', () => {
	const groups = [{ id: 'x', icon: '🦀', label: 'X', entries: [{ emoji: '🦀', keys: 'crab' }] }];
	assert.deepEqual(searchEmoji('elephant', groups), []);
	assert.deepEqual(searchEmoji('crab', groups).map((x) => x.emoji), ['🦀']);
});

test('EmojiPicker takes its labels as props: no i18n dependency reaches the kit', () => {
	assert.match(picker, /label = 'Choose an emoji',/);
	assert.match(picker, /searchLabel = 'Search an emoji…',/);
	assert.match(picker, /emptyLabel = 'No emoji matches\.',/);
	assert.match(picker, /groups = EMOJI_GROUPS,/);
	assert.match(picker, /columns = 8,/);
	assert.doesNotMatch(picker, /paraglide|\bm\./);
});

test('EmojiPicker draws every colour from real kit tokens', () => {
	assert.doesNotMatch(picker, /--surface-2|--c-muted/);
	assert.doesNotMatch(picker, /rgba?\(/);
	assert.match(picker, /background: var\(--bg-elevated-2\);/);
	assert.match(picker, /color: var\(--text-muted\);/);
});

test('the grid is a valid listbox with a roving tabindex, not 230 tab stops', () => {
	assert.match(picker, /role="listbox"/);
	assert.match(picker, /role="option"/);
	assert.doesNotMatch(picker, /<button[^>]*role="option"/s);
	assert.match(picker, /tabindex={i === active \? 0 : -1}/);
	assert.match(picker, /ArrowDown: active \+ columns/);
	assert.match(picker, /ArrowUp: active - columns/);
});

test('the tab strip is wired as a real tablist and announces group labels, not ids', () => {
	assert.match(picker, /role="tablist"/);
	assert.match(picker, /role="tab"/);
	assert.match(picker, /aria-controls={panelId}/);
	assert.match(picker, /aria-label={g\.label}/);
	assert.doesNotMatch(picker, /aria-label={g\.id}/);
	assert.match(picker, /role={searching \? undefined : 'tabpanel'}/);
	assert.match(picker, /aria-labelledby={searching \|\| !current \? undefined : tabId\(current\.id\)}/);
});

test('picking closes through the Popover close() handed to children (TSU-107)', () => {
	assert.match(picker, /{#snippet children\(\{ close \}: \{ close: \(\) => void \}\)}/);
	assert.match(picker, /function pick\(emoji: string, close: \(\) => void\)[\s\S]*close\(\);/);
	assert.doesNotMatch(picker, /closest<HTMLElement>\('\[popover\]'\)/);
});

test('EmojiPicker and the catalogue are exported from the barrel', () => {
	assert.match(index, /export { default as EmojiPicker } from '\.\/components\/molecules\/EmojiPicker\.svelte';/);
	assert.match(index, /export { EMOJI_GROUPS, type EmojiEntry, type EmojiGroup, searchEmoji } from '\.\/emoji';/);
});

test('demo shows the picker', () => {
	assert.match(page, /<EmojiPicker/);
});
