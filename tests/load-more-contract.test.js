import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [component, index] = await Promise.all([
	readFile(new URL('../src/lib/components/molecules/LoadMore.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8')
]);

test('LoadMore is exported from the package index', () => {
	assert.match(index, /export { default as LoadMore } from '\.\/components\/molecules\/LoadMore\.svelte';/);
});

test('props: state (default idle), onload, label, loadingLabel, errorLabel, retryLabel, doneLabel, pill', () => {
	assert.match(component, /state = 'idle',/);
	assert.match(component, /state\?: 'idle' \| 'loading' \| 'error' \| 'done';/);
	assert.match(component, /onload\?: \(\) => void;/);
	assert.match(component, /label = 'Load more',/);
	assert.match(component, /loadingLabel = 'Loading…',/);
	assert.match(component, /errorLabel = 'Failed to load',/);
	assert.match(component, /retryLabel = 'Retry',/);
	assert.match(component, /doneLabel = 'No more items',/);
	assert.match(component, /pill = false,/);
	assert.match(component, /data-tsu="LoadMore"/);
});

test('each state renders its own branch: done note, error + retry, idle/loading Button', () => {
	assert.match(component, /{#if state === 'done'}\s*<Text variant="caption" class="load-more-done">{doneLabel}<\/Text>/);
	assert.match(component, /{:else if state === 'error'}\s*<Text tone="danger" size="sm" class="load-more-error">{errorLabel}<\/Text>\s*<Button size="sm" onclick={\(\) => onload\?\.\(\)}>{retryLabel}<\/Button>/);
	assert.match(component, /loading={state === 'loading'}/);
	assert.match(component, /{state === 'loading' \? loadingLabel : label}/);
});

test('announces as a live status region, busy while loading, exposes data-state', () => {
	assert.match(component, /role="status"/);
	assert.match(component, /aria-busy={state === 'loading' \|\| undefined}/);
	assert.match(component, /data-state={state}/);
});

test('pill renders the compact rounded chip', () => {
	assert.match(component, /class:load-more-pill={pill}/);
	assert.match(component, /class={pill \? 'load-more-chip' : ''}/);
	assert.match(component, /\.load-more :global\(\.load-more-chip\)\s*{[^}]*border-radius: var\(--r-pill\);/s);
	assert.match(component, /\.load-more\s*{[^}]*justify-content: center;/s);
});
