import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/layouts/NavItem.svelte', import.meta.url),
	'utf8'
);

test('NavItem icon is optional; iconChildren, iconPath and iconSize are the custom-glyph escape hatches', () => {
	assert.match(source, /icon\?: IconName;/);
	assert.match(source, /iconChildren\?: Snippet;/);
	assert.match(source, /iconPath\?: string;/);
	assert.match(source, /iconSize = 18,/);
	assert.match(source, /iconSize\?: number;/);
	assert.match(source, /{#if iconChildren}\s*<Icon size={iconSize}>{@render iconChildren\(\)}<\/Icon>/);
	assert.match(source, /{:else if iconPath}\s*<Icon size={iconSize}><path d={iconPath} \/><\/Icon>/);
	assert.match(source, /{:else if icon}\s*<Icon name={icon} size={iconSize} \/>/);
	assert.doesNotMatch(source, /<Icon name={icon}>/);
});

test('activeStyle defaults to fill; bar swaps the rounded marker for a 2px inset accent bar', () => {
	assert.match(source, /activeStyle = 'fill',/);
	assert.match(source, /activeStyle\?: 'fill' \| 'bar';/);
	assert.match(source, /class:bar={activeStyle === 'bar'}/);
	assert.match(source, /\.nav-item\.active:not\(\.bar\)::before\s*{/);
	assert.match(source, /\.nav-item\.bar\.active\s*{[^}]*color-mix\(in srgb, var\(--accent\) 10%, transparent\);[^}]*box-shadow: inset 2px 0 0 var\(--accent\);/s);
	assert.match(source, /\.nav-item\.active\s*{[^}]*color-mix\(in srgb, var\(--accent\) 14%, transparent\);/s);
});

test('existing surface is intact: label, href, active, badge, badgeTone, children, aria-current', () => {
	assert.match(source, /label: string;/);
	assert.match(source, /href\?: string;/);
	assert.match(source, /badge\?: string \| number;/);
	assert.match(source, /badgeTone\?: BadgeTone;/);
	assert.match(source, /children\?: Snippet;/);
	assert.match(source, /aria-current={active \? 'page' : undefined}/);
});
