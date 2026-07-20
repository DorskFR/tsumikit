import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const popover = await readFile(
	new URL('../src/lib/components/molecules/Popover.svelte', import.meta.url),
	'utf8'
);

test('panel content mounts only after the first open, then stays mounted', () => {
	assert.match(popover, /let opened = \$state\(false\);/);
	assert.match(popover, /if \(e\.newState === 'open'\)\s*{\s*const firstOpen = !opened;\s*opened = true;/);
	assert.match(popover, /{#if opened}\s*{@render children\(\)}\s*{\/if}/);
});

test('the panel element itself always renders so the native popovertarget stays wired', () => {
	const panel = popover.slice(popover.indexOf('<div'));
	assert.match(panel, /bind:this={panelEl}/);
	assert.match(panel, /popover="auto"/);
	assert.doesNotMatch(popover, /{#if [^}]*}\s*<div[\s\S]*bind:this={panelEl}/);
});
