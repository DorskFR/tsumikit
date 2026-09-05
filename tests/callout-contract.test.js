import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [component, index, icon] = await Promise.all([
	readFile(new URL('../src/lib/components/molecules/Callout.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/components/atoms/Icon.svelte', import.meta.url), 'utf8')
]);

test('Callout is exported from the package index', () => {
	assert.match(index, /export { default as Callout } from '\.\/components\/molecules\/Callout\.svelte';/);
});

test('props: tone (default info), icon, title, dismissible, ondismiss, busy, actions snippet', () => {
	assert.match(component, /tone = 'info',/);
	assert.match(component, /tone\?: Tone;/);
	assert.match(component, /icon\?: IconName;/);
	assert.match(component, /title\?: string;/);
	assert.match(component, /dismissible\?: boolean;/);
	assert.match(component, /ondismiss\?: \(\) => void;/);
	assert.match(component, /busy\?: boolean;/);
	assert.match(component, /children\?: Snippet;/);
	assert.match(component, /actions\?: Snippet;/);
});

test('composes a toned Card and announces as status, alert for danger', () => {
	assert.match(component, /<Card\s+tone={t}/);
	assert.match(component, /role={t === 'danger' \? 'alert' : 'status'}/);
});

test('default glyphs per tone exist in the Icon registry', () => {
	const map = component.match(/const DEFAULT_ICON: Record<Tone, IconName> = {([^}]+)}/);
	assert.ok(map, 'DEFAULT_ICON map present');
	const names = [...map[1].matchAll(/:\s*'([a-z-]+)'/g)].map((m) => m[1]);
	assert.deepEqual(new Set(names).size > 0, true);
	for (const n of names) assert.match(icon, new RegExp(`^\\s+${n}: '`, 'm'), `icon ${n} missing`);
	assert.match(component, /icon \?\? DEFAULT_ICON\[tone\]/);
});

test('busy swaps the glyph for a Spinner', () => {
	assert.match(component, /{#if busy}\s*<Spinner \/>/);
});

test('dismiss is a labelled inline IconButton firing ondismiss', () => {
	assert.match(component, /{#if dismissible}/);
	assert.match(component, /<IconButton icon="x" inline label={dismissLabel} onclick={\(\) => ondismiss\?\.\(\)} \/>/);
	assert.match(component, /dismissLabel = 'Dismiss'/);
});

test('layout: flex row that wraps, actions pushed right', () => {
	assert.match(component, /display: flex;\s*flex-wrap: wrap;\s*align-items: flex-start;\s*gap: var\(--sp-3\)/);
	assert.match(component, /\.callout-actions\s*{[^}]*margin-left: auto;/);
	assert.match(component, /\.callout-body\s*{[^}]*min-width: 0;/);
});

test('tone token --callout-tone maps to semantic colours', () => {
	for (const t of ['ok', 'warn', 'danger', 'info']) {
		assert.match(component, new RegExp(`\\.callout-${t}\\)\\s*{\\s*--callout-tone: var\\(--${t}\\);`));
	}
});
