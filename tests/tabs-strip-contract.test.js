import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { hasDecl, normalize } from './helpers.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
const [tabs, docs, readme] = await Promise.all([
	read('../src/lib/components/molecules/Tabs.svelte'),
	read('../src/routes/+page.svelte'),
	read('../README.md')
]);
const src = normalize(tabs);

test('panel is optional, so the tablist can stand alone as a document strip', () => {
	assert.match(src, /panel\?: Snippet<\[string\]>;/);
	assert.match(src, /\{#if panel\} <div role="tabpanel" id=\{panelId\}/);
	assert.match(src, /const panelId = \$derived\(panel \? `\$\{baseId\}-panel` : undefined\);/);
	assert.match(src, /aria-controls=\{panelId\}/);
});

test('closable strip API: closable, onclose(id), closeLabel, leading(tab), actions', () => {
	assert.match(src, /closable\?: boolean;/);
	assert.match(src, /onclose\?: \(id: string\) => void;/);
	assert.match(src, /closeLabel\?: string;/);
	assert.match(src, /closeLabel = 'Close tab'/);
	assert.match(src, /leading\?: Snippet<\[TabItem\]>;/);
	assert.match(src, /actions\?: Snippet;/);
	assert.match(src, /\{#if leading\}\{@render leading\(t\)\}\{\/if\}/);
	assert.match(src, /\{#if actions\} <div class="actions">\{@render actions\(\)\}<\/div> \{\/if\}/);
});

test('TabItem gains title and a per-tab closable override', () => {
	assert.match(src, /title\?: string;/);
	assert.match(src, /closable\?: boolean;/);
	assert.match(src, /function canClose\(t: TabItem\): boolean \{ return t\.closable \?\? closable; \}/);
	assert.match(src, /title=\{t\.title \?\? t\.attrs\?\.title\}/);
});

test('a closable tab is a div role=tab hosting a real close button outside the Tab order', () => {
	assert.match(src, /\{#if canClose\(t\)\}/);
	assert.match(src, /<div \{\.\.\.t\.attrs as HTMLAttributes<HTMLDivElement>\} role="tab" id="\{baseId\}-tab-\{t\.id\}"/);
	assert.match(src, /class="tab closable"/);
	assert.match(src, /aria-disabled=\{t\.disabled \|\| undefined\}/);
	assert.match(src, /<IconButton icon="x" label=\{closeLabel\} inline hoverDanger size=\{14\} hitArea="compact" tabindex=\{-1\}/);
	assert.match(src, /e\.stopPropagation\(\); close\(t\.id\);/);
	assert.match(src, /<button type="button" \{\.\.\.t\.attrs\} role="tab"/, 'plain tabs stay buttons');
});

test('Delete closes the focused tab and middle-click closes any tab', () => {
	assert.match(src, /if \(e\.key === 'Delete'\) \{ if \(!canClose\(tabs\[i\]\)\) return; e\.preventDefault\(\); close\(tabs\[i\]\.id, true\); return; \}/);
	assert.match(src, /function onauxclick\(e: MouseEvent, id: string\) \{ if \(e\.button !== 1\) return; e\.preventDefault\(\); close\(id\); \}/);
	assert.match(src, /onauxclick=\{\(e\) => onauxclick\(e, t\.id\)\}/);
});

test('closing the selected tab hands selection (and keyboard focus) to a neighbour before onclose', () => {
	const close = src.match(/function close\(id: string, focus = false\) \{.*?onclose\?\.\(id\); \}/)?.[0] ?? '';
	assert.match(close, /if \(i < 0 \|\| !canClose\(tabs\[i\]\)\) return;/);
	assert.match(close, /if \(value === id\)/);
	assert.match(close, /others\.find\(\(t\) => tabs\.indexOf\(t\) > i\) \?\? others\.at\(-1\)/);
	assert.match(close, /if \(next\) select\(next\.id, focus\); else value = undefined;/);
	assert.ok(close.indexOf('select(next.id, focus)') < close.indexOf('onclose?.(id)'));
});

test('arrow, Home and End navigation is untouched by the strip mode', () => {
	assert.match(src, /if \(e\.key === 'ArrowRight'\) next = step\(i, 1\); else if \(e\.key === 'ArrowLeft'\) next = step\(i, -1\); else if \(e\.key === 'Home'\)/);
	assert.match(src, /else if \(e\.key === 'End'\)/);
	assert.match(src, /role="tablist" aria-label=\{label\} tabindex="-1" class="tablist" \{onkeydown\}/);
});

test('the strip row keeps the tablist scrolling and continues the rule under the actions', () => {
	assert.ok(hasDecl(tabs, '.strip', 'display', 'flex'));
	assert.ok(hasDecl(tabs, '.tablist', 'flex', '1 1 auto'));
	assert.ok(hasDecl(tabs, '.tablist', 'min-width', '0'));
	assert.ok(hasDecl(tabs, '.tablist', 'overflow-x', 'auto'));
	assert.ok(hasDecl(tabs, '.actions', 'border-bottom', '1px solid var(--border)'));
	assert.ok(hasDecl(tabs, '.tab.closable', 'cursor', 'pointer'));
	assert.ok(hasDecl(tabs, '.label', 'text-overflow', 'ellipsis'));
	assert.ok(hasDecl(tabs, '.tab', 'max-width', 'var(--tab-max-width, none)'));
	assert.match(readme, /\| `Tabs` \| `--tab-max-width` \|/);
});

test('demo and README cover the closable strip', () => {
	assert.match(docs, /<Tabs tabs=\{docTabs\} bind:value=\{docTabValue\} label="Open documents" closable onclose=\{closeDoc\}/);
	assert.match(docs, /\{#snippet leading\(t\)\}\s*<Dot status=/);
	assert.match(docs, /\{#snippet actions\(\)\}/);
	assert.match(docs, /\{ id: 'pinned', label: 'Pinned', closable: false \}/);
	assert.match(readme, /omit `panel` for a strip-only tablist/);
	assert.match(readme, /`closable` \+ `onclose\(id\)`/);
});
