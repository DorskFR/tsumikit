import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const tabs = await readFile(
	new URL('../src/lib/components/molecules/Tabs.svelte', import.meta.url),
	'utf8'
);

const tablist = tabs.match(/\.tablist \{[^}]*\}/)?.[0] ?? '';
const tab = tabs.match(/(?:^|[}\n])\s*\.tab \{[^}]*\}/)?.[0] ?? '';

test('Tabs scrolls its list instead of overflowing a narrow viewport', () => {
	assert.match(tablist, /overflow-x: auto/);
});

test('Tabs keeps each tab on one line at its natural width', () => {
	assert.match(tab, /flex: 0 0 auto/);
	assert.match(tab, /white-space: nowrap/);
});

test('Tabs brings the selected tab back into view when the list scrolls', () => {
	assert.match(tabs, /scrollIntoView\(\{ block: 'nearest', inline: 'nearest' \}\)/);
});

test('Tabs scrolls on selection whether or not focus moves', () => {
	const select = tabs.match(/function select\([^)]*\) \{[\s\S]*?\n\t\}/)?.[0] ?? '';
	assert.match(select, /scrollIntoView/);
	assert.ok(
		select.indexOf('scrollIntoView') < select.indexOf('if (focus)'),
		'the scroll must not sit behind the focus check'
	);
});

test('tab list clips the vertical axis so the -1px indicator overlap never paints a scrollbar', () => {
	assert.match(tabs, /\.tablist\s*{[^}]*overflow-x: auto;\s*overflow-y: hidden;/s);
});
