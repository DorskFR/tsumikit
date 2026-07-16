import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} name */
const component = (name) =>
	readFile(new URL(`../src/lib/components/${name}`, import.meta.url), 'utf8');

const [cluster, select, input, button, iconButton, segmented, option] = await Promise.all([
	component('layouts/Cluster.svelte'),
	component('atoms/Select.svelte'),
	component('atoms/Input.svelte'),
	component('atoms/Button.svelte'),
	component('molecules/IconButton.svelte'),
	component('molecules/SegmentedControl.svelte'),
	component('molecules/OptionButton.svelte')
]);

test('Cluster size cascades --control-height and grow shares row width', () => {
	assert.match(cluster, /size\?: 'sm' \| 'md' \| 'lg'/);
	assert.match(cluster, /style:--control-height={size \? CONTROL_TIER\[size\] : undefined}/);
	assert.match(cluster, /grow\?: boolean/);
	assert.match(cluster, /\.cluster-grow > :global\(\*\)\s*{[^}]*flex: 1 1 0;/s);
});

test('Select gains an sm|md scale sharing the compact control height', () => {
	assert.match(select, /size\?: 'sm' \| 'md'/);
	assert.match(select, /const small = \$derived\(compact \|\| size === 'sm'\)/);
	assert.match(select, /\.select\.select-sm\s*{[^}]*height: var\(--control-height-compact\);/s);
});

test('Input exposes a grow layout prop', () => {
	assert.match(input, /grow\?: boolean/);
	assert.match(input, /class:input-grow={grow}/);
	assert.match(input, /\.input-grow\s*{[^}]*flex: 1 1 0;/s);
});

test('Button gains grow plus as="a"/href link polymorphism', () => {
	assert.match(button, /grow\?: boolean/);
	assert.match(button, /as\?: 'button' \| 'a'/);
	assert.match(button, /href\?: string/);
	assert.match(button, /<svelte:element\s+this={tag}/);
	assert.match(button, /href !== undefined \|\| as === 'a' \? 'a' : 'button'/);
	assert.match(button, /a\.btn\[aria-disabled='true'\]\s*{[^}]*pointer-events: none;/s);
});

test('IconButton forwards link polymorphism', () => {
	assert.match(iconButton, /as\?: 'button' \| 'a'/);
	assert.match(iconButton, /href\?: string/);
});

test('SegmentedControl exposes the shared control-height contract', () => {
	assert.match(segmented, /control\?: boolean/);
	assert.match(segmented, /class:seg-control={control}/);
	assert.match(segmented, /\.seg-control\s*{[^}]*height: var\(--control-height\);/s);
});

test('OptionButton adds a left-aligned full-width row variant', () => {
	assert.match(option, /align\?: 'center' \| 'start'/);
	assert.match(option, /block\?: boolean/);
	assert.match(option, /\.opt\.block\s*{[^}]*width: 100%;/s);
	assert.match(option, /\.opt\.row\.align-start\s*{[^}]*justify-content: flex-start;/s);
});
