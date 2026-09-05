import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [prose, bubble, composer, attachments, codeblock, index] = await Promise.all([
	read('components/molecules/Prose.svelte'),
	read('components/molecules/ChatBubble.svelte'),
	read('components/molecules/Composer.svelte'),
	read('components/molecules/AttachmentList.svelte'),
	read('components/molecules/CodeBlock.svelte'),
	read('index.ts')
]);

test('chat primitives are exported', () => {
	for (const name of ['Prose', 'ChatBubble', 'Composer', 'AttachmentList']) {
		assert.match(index, new RegExp(`default as ${name},?[^}]*} from '\\./components/molecules/${name}\\.svelte';`));
	}
});

test('Prose: html or children, compact rhythm, --md-* token driven', () => {
	assert.match(prose, /html\?: string;/);
	assert.match(prose, /compact\?: boolean;/);
	assert.match(prose, /{#if html !== undefined}{@html html}{:else}{@render children\?\.\(\)}{\/if}/);
	assert.match(prose, /color: var\(--md-code, var\(--text\)\);/);
	assert.match(prose, /\.prose :global\(table\)/);
});

test('ChatBubble: role tokens, align, meta/actions, delivery state + retry, clamp, selected, copyText', () => {
	assert.match(bubble, /role\?: 'user' \| 'assistant' \| 'system' \| 'tool' \| 'mcp';/);
	assert.match(bubble, /const side = \$derived\(align \?\? \(role === 'user' \? 'end' : 'start'\)\)/);
	assert.match(bubble, /state\?: 'sending' \| 'failed';/);
	assert.match(bubble, /onretry\?: \(\) => void;/);
	assert.match(bubble, /clamp\?: number;/);
	assert.match(bubble, /-webkit-line-clamp: var\(--clamp\);/);
	assert.match(bubble, /copyText\?: string;/);
	assert.match(bubble, /<CopyButton text={copyText} showLabel={false} box="xs" \/>/);
	for (const r of ['user', 'system', 'tool', 'mcp']) assert.match(bubble, new RegExp(`\\.role-${r}\\s*{\\s*--role: var\\(--role-${r}\\);`));
});

test('Composer: bindable value/attachments, submit modes, history at edges, paste + drop to attach', () => {
	assert.match(composer, /value = \$bindable\(''\)/);
	assert.match(composer, /attachments = \$bindable\(\[\]\)/);
	assert.match(composer, /submitOn\?: 'enter' \| 'mod-enter' \| 'auto';/);
	assert.match(composer, /history\?: string\[\];/);
	assert.match(composer, /e\.key === 'ArrowUp' && atStart/);
	assert.match(composer, /e\.key === 'ArrowDown' && atEnd && cursor !== -1/);
	assert.match(composer, /const files = Array\.from\(e\.clipboardData\?\.files \?\? \[\]\);/);
	assert.match(composer, /<AttachmentList files={attachments} onremove={removeAt} \/>/);
	assert.match(composer, /maxHeight = '40vh'/);
});

test('AttachmentList renders removable mono Badges with sizes', () => {
	assert.match(attachments, /files: \(File \| Attachment\)\[\];/);
	assert.match(attachments, /removable={!!onremove}/);
	assert.match(attachments, /function fmt\(size: number \| undefined\)/);
});

test('CodeBlock gains maxHeight, collapsible and breakAll', () => {
	assert.match(codeblock, /maxHeight\?: string;/);
	assert.match(codeblock, /collapsible\?: boolean;/);
	assert.match(codeblock, /breakAll\?: boolean;/);
	assert.match(codeblock, /style:max-height={capped \? maxHeight : undefined}/);
	assert.match(codeblock, /\.cb-body\.break-all \.cb-pre\s*{\s*white-space: pre-wrap;\s*word-break: break-all;/);
});
