import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} p */
const read = (p) => readFile(new URL(`../src/lib/components/${p}`, import.meta.url), 'utf8');
/** @param {string} src */
const css = (src) => src.slice(src.indexOf('<style>'));
/** @param {string} sheet @param {string} selector */
const rule = (sheet, selector) => {
	const m = sheet.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
	assert.ok(m, `missing rule ${selector}`);
	return m[1];
};
const reach = /calc\(var\(--focus-ring-width\) \+ var\(--focus-ring-offset\)\)/;
const negReach = /calc\(-1 \* \(var\(--focus-ring-width\) \+ var\(--focus-ring-offset\)\)\)/;

test('CodeBlock body rows size to their content so a capped body scrolls the whole gutter and code', async () => {
	assert.match(rule(css(await read('molecules/CodeBlock.svelte')), '.cb-body'), /align-items:\s*flex-start/);
});

test('CodeBlock head ellipsizes a long filename instead of pushing the copy button out', async () => {
	const name = rule(css(await read('molecules/CodeBlock.svelte')), '.cb-name');
	assert.match(name, /min-width:\s*0/);
	assert.match(name, /overflow:\s*hidden/);
	assert.match(name, /text-overflow:\s*ellipsis/);
	assert.match(name, /white-space:\s*nowrap/);
});

test('FilterInput wraps inline nodes before squeezing the input below a usable width', async () => {
	const sheet = css(await read('molecules/FilterInput.svelte'));
	assert.match(rule(sheet, '.fi__bar'), /flex-wrap:\s*wrap/);
	assert.match(rule(sheet, '.fi__field'), /min-width:\s*min\(100%, 6rem\)/);
});

test('FilterSearchBar chips truncate a long value inside the badge and keep the full text as a title', async () => {
	const src = await read('organisms/FilterSearchBar.svelte');
	assert.match(src, /<Badge\s+tone="info"\s+truncate\s+title=/);
	assert.match(src, /<Badge tone="neutral" truncate title="text \{text\}">/);
});

test('StatusBar label leaves room for a link focus ring above and below the line', async () => {
	const label = rule(css(await read('molecules/StatusBar.svelte')), '.status-label');
	assert.match(label, new RegExp(`padding-block:\\s*${reach.source}`));
	assert.match(label, new RegExp(`margin-block:\\s*${negReach.source}`));
	assert.match(label, /overflow:\s*hidden/);
});

test('Clamped ChatBubble body keeps focus rings visible on top and sides without revealing the next line', async () => {
	const body = rule(css(await read('molecules/ChatBubble.svelte')), '.clamped .body');
	assert.match(body, new RegExp(`padding:\\s*${reach.source}`));
	assert.match(body, /padding-block-end:\s*0/);
	assert.match(body, new RegExp(`margin:\\s*${negReach.source}`));
	assert.match(body, /margin-block-end:\s*0/);
});

test('ConversationFeed scroller contains absolutely positioned descendants', async () => {
	assert.match(rule(css(await read('organisms/ConversationFeed.svelte')), '.feed'), /position:\s*relative/);
});
