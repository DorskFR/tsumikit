import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const tokens = await readFile(new URL('../src/lib/styles/tokens.css', import.meta.url), 'utf8');

function coarseRoot() {
	const at = tokens.indexOf('@media (pointer: coarse)');
	assert.ok(at > -1, 'tokens.css has a coarse-pointer block');
	const open = tokens.indexOf(':root {', at);
	return tokens.slice(open, tokens.indexOf('}', open));
}

test('coarse pointers: md controls and md/lg boxes are 44px targets', () => {
	const block = coarseRoot();
	assert.match(block, /--control-height-default: var\(--touch-target\);/);
	assert.match(block, /--box-md: var\(--touch-target\);/);
	assert.match(tokens, /--box-lg: var\(--control-height-default\);/);
});

test('coarse pointers: compact slabs reach the full touch target', () => {
	assert.match(coarseRoot(), /--touch-target-compact: var\(--touch-target\);/);
});

test('coarse pointers keep sm compact so sm toolbars line up', () => {
	const block = coarseRoot();
	assert.doesNotMatch(block, /--control-height-compact|--box-sm|--box-xs/);
});

test('coarse pointers: pill tabs fill the touch target instead of sitting 6px inside the track', async () => {
	const tabs = await readFile(new URL('../src/lib/components/molecules/Tabs.svelte', import.meta.url), 'utf8');
	const coarse = tabs.slice(tabs.indexOf('@media (pointer: coarse)'));
	assert.match(coarse, /^@media \(pointer: coarse\) {\s*& \.tab {\s*min-height: var\(--touch-target\);/);
});
