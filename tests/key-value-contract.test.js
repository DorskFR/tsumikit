import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [component, index] = await Promise.all([
	readFile(new URL('../src/lib/components/molecules/KeyValue.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8')
]);

test('KeyValue and its row types are exported from the package index', () => {
	assert.match(index, /default as KeyValue,\s+type KeyValueRow,\s+type KeyValueTone,\s+} from '\.\/components\/molecules\/KeyValue\.svelte';/);
	assert.match(component, /export interface KeyValueRow {/);
	assert.match(component, /export type KeyValueTone = 'neutral' \| 'ok' \| 'warn' \| 'danger' \| 'info'/);
});

test('rows carry label, string|number|Snippet value, mono, tone, hint', () => {
	assert.match(component, /label: string;/);
	assert.match(component, /value: string \| number \| Snippet;/);
	assert.match(component, /mono\?: boolean;/);
	assert.match(component, /tone\?: KeyValueTone;/);
	assert.match(component, /hint\?: string;/);
});

test('props: columns 1|2 (default 1), dense, align start|end (default start)', () => {
	assert.match(component, /columns = 1,/);
	assert.match(component, /columns\?: 1 \| 2;/);
	assert.match(component, /dense = false,/);
	assert.match(component, /align = 'start',/);
	assert.match(component, /align\?: 'start' \| 'end';/);
	assert.match(component, /class:kv-cols-2={columns === 2}/);
	assert.match(component, /class:kv-dense={dense}/);
	assert.match(component, /class:kv-align-end={align === 'end'}/);
});

test('renders a semantic <dl> grid with dt/dd pairs grouped by display: contents rows', () => {
	assert.match(component, /<dl\s+data-tsu="KeyValue"/);
	assert.match(component, /<dt class="kv-label">{row\.label}<\/dt>/);
	assert.match(component, /<dd class="kv-value">/);
	assert.match(component, /\.kv\s*{[^}]*display: grid;[^}]*grid-template-columns: max-content minmax\(0, 1fr\);/s);
	assert.match(component, /\.kv-cols-2\s*{\s*grid-template-columns: repeat\(2, max-content minmax\(0, 1fr\)\);/);
	assert.match(component, /\.kv-row\s*{\s*display: contents;/);
	assert.match(component, /\.kv-align-end \.kv-value\s*{\s*text-align: end;/);
});

test('snippet values render; scalar values go through Text with tone/mono/numeric mapping', () => {
	assert.match(component, /{#if typeof row\.value === 'function'}\s*{@render row\.value\(\)}/);
	assert.match(component, /tone={TEXT_TONE\[row\.tone \?\? 'neutral'\]}/);
	assert.match(component, /variant={row\.mono \? 'code' : undefined}/);
	assert.match(component, /numeric={typeof row\.value === 'number'}/);
	assert.match(component, /ok: 'success',/);
	assert.match(component, /info: 'accent',/);
	assert.match(component, /{#if row\.hint}\s*<Text as="div" variant="caption" class="kv-hint">{row\.hint}<\/Text>/);
});
