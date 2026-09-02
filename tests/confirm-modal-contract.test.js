import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/molecules/ConfirmModal.svelte', import.meta.url),
	'utf8'
);
const button = await readFile(
	new URL('../src/lib/components/atoms/Button.svelte', import.meta.url),
	'utf8'
);
const index = await readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8');

test('ConfirmModal prop surface', () => {
	assert.match(source, /open = \$bindable\(false\)/);
	assert.match(source, /title: string;/);
	assert.match(source, /message\?: string;/);
	assert.match(source, /children\?: Snippet;/);
	assert.match(source, /confirmLabel = 'Confirm'/);
	assert.match(source, /cancelLabel = 'Cancel'/);
	assert.match(source, /tone = 'primary'/);
	assert.match(source, /tone\?: 'primary' \| 'danger' \| 'warn';/);
	assert.match(source, /busy\?: boolean;/);
	assert.match(source, /onconfirm: \(\) => void \| Promise<void>;/);
	assert.match(source, /oncancel\?: \(\) => void;/);
	assert.match(source, /data-tsu="ConfirmModal"/);
});

test('ConfirmModal drives Modal open/tone/busy and maps tone onto the confirm Button', () => {
	assert.match(source, /<Modal\s+bind:open\s+{title}\s+tone={tone === 'primary' \? 'neutral' : tone}\s+busy={working}/s);
	assert.match(source, /const working = \$derived\(busy \|\| pending\);/);
	assert.match(source, /variant={tone === 'danger' \? 'danger' : 'primary'}/);
	assert.match(source, /tone={tone === 'warn' \? 'warn' : 'none'}/);
	assert.match(source, /loading={working}/);
	assert.match(source, /<Button onclick={cancel} disabled={working}>{cancelLabel}<\/Button>/);
});

test('ConfirmModal waits for an async onconfirm, closes only on success and surfaces rejections', () => {
	assert.match(source, /if \(result instanceof Promise\) {\s*pending = true;\s*await result;\s*}\s*open = false;/s);
	assert.match(source, /catch \(e\) {\s*error = e instanceof Error \? e\.message : String\(e\);/s);
	assert.match(source, /finally {\s*pending = false;/s);
	assert.match(source, /{#if error}\s*<Text variant="caption" tone="danger" role="alert"/s);
	assert.match(source, /function cancel\(\) {\s*if \(working\) return;\s*open = false;\s*oncancel\?\.\(\);/s);
});

test('Button accepts tone="danger" as an alias of variant="danger"', () => {
	assert.match(button, /class:btn-danger={variant === 'danger' \|\| \(tone === 'danger' && variant === 'default'\)}/);
	assert.match(button, /class:btn-tone-danger={tone === 'danger'}/);
});

test('ConfirmModal is exported', () => {
	assert.match(index, /export { default as ConfirmModal } from '\.\/components\/molecules\/ConfirmModal\.svelte';/);
});
