import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const empty = await readFile(new URL('../src/lib/components/molecules/EmptyState.svelte', import.meta.url), 'utf8');
const skeleton = await readFile(new URL('../src/lib/components/atoms/Skeleton.svelte', import.meta.url), 'utf8');
const index = await readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8');

test('EmptyState accepts loading, size and a snippet description', () => {
	assert.match(empty, /loading = false,/);
	assert.match(empty, /loading\?: boolean;/);
	assert.match(empty, /size,\n/);
	assert.match(empty, /size\?: 'inline' \| 'compact' \| 'default';/);
	assert.match(empty, /description\?: string \| Snippet;/);
	assert.match(empty, /\{#if typeof description === 'function'\}\{@render description\(\)\}\{:else\}\{description\}\{\/if\}/);
});

test('EmptyState title is optional and only rendered when set', () => {
	assert.match(empty, /title\?: string;/);
	assert.match(empty, /\{#if title\}<p class="empty-title">\{title\}<\/p>\{\/if\}/);
});

test('compact stays accepted and maps onto size', () => {
	assert.match(empty, /compact\?: boolean;/);
	assert.match(empty, /const sz = \$derived\(size \?\? \(compact \? 'compact' : 'default'\)\);/);
	assert.match(empty, /@deprecated use `size="compact"`; `size` wins/);
	assert.match(empty, /class:empty-compact=\{sz === 'compact'\}/);
});

test('loading renders a Spinner in the chip and marks the root busy', () => {
	assert.match(empty, /import Spinner from '\.\.\/atoms\/Spinner\.svelte';/);
	assert.match(empty, /\{#if loading\}\s*<span class="empty-chip">\s*<Spinner \/>/);
	assert.match(empty, /aria-busy=\{loading \? 'true' : undefined\}/);
	assert.match(empty, /class:empty-loading=\{loading\}/);
});

test('inline size is a single muted row without an icon chip', () => {
	assert.match(empty, /class:empty-inline=\{sz === 'inline'\}/);
	assert.match(empty, /\{:else if \(icon \|\| iconChildren\) && sz !== 'inline'\}/);
	assert.match(empty, /\.empty-inline\s*{\s*flex-direction: row;\s*justify-content: center;\s*gap: var\(--sp-2\);\s*padding: var\(--sp-6\) var\(--sp-4\);/);
	assert.match(empty, /\.empty-inline \.empty-title\s*{\s*color: var\(--text-muted\);\s*font-weight: var\(--fw-normal\);\s*font-size: var\(--fs-sm\);/);
});

test('Skeleton atom exposes width/height/lines/circle/radius', () => {
	for (const p of ['width', 'height', 'lines', 'circle', 'radius']) {
		assert.match(skeleton, new RegExp(`\\b${p}\\?:`));
	}
	assert.match(skeleton, /width = '100%',/);
	assert.match(skeleton, /height = '1em',/);
	assert.match(skeleton, /lines = 1,/);
	assert.match(skeleton, /radius = 'var\(--r-sm\)',/);
	assert.match(skeleton, /data-tsu="Skeleton"/);
	assert.match(skeleton, /aria-hidden="true"/);
	assert.match(skeleton, /class="skeleton-bar"/);
	assert.match(skeleton, /circle \? '50%' : radius/);
	assert.match(skeleton, /i === count - 1 \? '60%'/);
});

test('Skeleton shimmers and honours reduced motion', () => {
	assert.match(skeleton, /animation: tsu-shimmer 1\.4s ease-in-out infinite;/);
	assert.match(skeleton, /@keyframes tsu-shimmer\s*{\s*from\s*{\s*background-position: 200% 0;\s*}\s*to\s*{\s*background-position: -200% 0;/);
	assert.match(skeleton, /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.skeleton-bar\s*{\s*animation: none;\s*background: var\(--bg-elevated-2\);/);
});

test('index exports Skeleton', () => {
	assert.match(index, /export \{ default as Skeleton \} from '\.\/components\/atoms\/Skeleton\.svelte';/);
});
