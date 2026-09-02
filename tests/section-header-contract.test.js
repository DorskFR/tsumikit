import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [component, index, icon] = await Promise.all([
	readFile(new URL('../src/lib/components/molecules/SectionHeader.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/components/atoms/Icon.svelte', import.meta.url), 'utf8')
]);

test('SectionHeader is exported from the package index', () => {
	assert.match(index, /export { default as SectionHeader } from '\.\/components\/molecules\/SectionHeader\.svelte';/);
});

test('props: title with label alias, level 1-4 (default 2), size, subtitle, icon, count, tone, hue, uppercase, divider, sticky, collapsible, bindable open, actions', () => {
	assert.match(component, /title\?: string;/);
	assert.match(component, /label\?: string;/);
	assert.match(component, /const text = \$derived\(title \?\? label \?\? ''\)/);
	assert.match(component, /level = 2,/);
	assert.match(component, /level\?: 1 \| 2 \| 3 \| 4;/);
	assert.match(component, /size\?: Size;/);
	assert.match(component, /subtitle\?: string;/);
	assert.match(component, /icon\?: IconName;/);
	assert.match(component, /count\?: number \| string;/);
	assert.match(component, /tone = 'neutral',/);
	assert.match(component, /hue\?: number;/);
	assert.match(component, /uppercase = false,/);
	assert.match(component, /divider = false,/);
	assert.match(component, /sticky = false,/);
	assert.match(component, /collapsible = false,/);
	assert.match(component, /open = \$bindable\(true\),/);
	assert.match(component, /actions\?: Snippet;/);
	assert.match(component, /children\?: Snippet;/);
	assert.match(component, /data-tsu="SectionHeader"/);
});

test('title is a Heading at the given level; count is faint, normal-weight tabular Text', () => {
	assert.match(component, /<Heading {level} {size} class="sh-title">{text}<\/Heading>/);
	assert.match(component, /<Text tone="faint" weight="normal" numeric class="sh-count">{count}<\/Text>/);
	assert.match(component, /<Text variant="caption" class="sh-subtitle">{subtitle}<\/Text>/);
});

test('hue renders a swatch chip driven by --sh-hue; icon glyphs resolve from the registry', () => {
	assert.match(component, /{#if hue !== undefined}\s*<span class="sh-swatch" style:--sh-hue={hue} aria-hidden="true">/);
	assert.match(component, /background: hsl\(var\(--sh-hue\) 70% 55%\)/);
	assert.match(component, /<Icon name="chevron-right" class="sh-chevron" \/>/);
	assert.match(icon, /^\s+'chevron-right': '/m);
});

test('layout: wrapping flex row, actions pushed to the inline end, divider underlines the row', () => {
	assert.match(component, /\.sh-row\s*{[^}]*display: flex;[^}]*align-items: center;[^}]*gap: var\(--sp-3\);[^}]*flex-wrap: wrap;/s);
	assert.match(component, /\.sh-actions\s*{[^}]*margin-inline-start: auto;/s);
	assert.match(component, /class:sh-divider={divider}/);
	assert.match(component, /\.sh-divider > \.sh-row\s*{[^}]*border-bottom: 1px solid var\(--border\);/s);
});

test('sticky pins under the app header and publishes --section-header-h on the parent', () => {
	assert.match(component, /class:sh-sticky={sticky}/);
	assert.match(component, /\.sh-sticky\s*{[^}]*position: sticky;[^}]*top: var\(--sticky-offset, var\(--header-h, 0\)\);/s);
	assert.match(component, /bind:offsetHeight={height}/);
	assert.match(component, /parent\.style\.setProperty\('--section-header-h', `\$\{height\}px`\)/);
	assert.match(component, /parent\.style\.removeProperty\('--section-header-h'\)/);
});

test('collapsible turns the title into a disclosure button controlling the children panel', () => {
	assert.match(component, /{#if collapsible}\s*<button\s+type="button"\s+class="sh-toggle"\s+aria-expanded={open}\s+aria-controls={panelId}\s+onclick={\(\) => \(open = !open\)}/);
	assert.match(component, /{#if children && \(!collapsible \|\| open\)}\s*<div class="sh-panel" id={panelId}>{@render children\(\)}<\/div>/);
	assert.match(component, /\.sh-open :global\(\.sh-chevron\)\s*{\s*transform: rotate\(90deg\);/);
});

test('tone token --sh-tone maps to semantic colours and tints the title', () => {
	for (const t of ['ok', 'warn', 'danger', 'info']) {
		assert.match(component, new RegExp(`\\.sh-${t}\\s*{\\s*--sh-tone: var\\(--${t}\\);`));
	}
	assert.match(component, /\.section-header :global\(\.sh-title\)\s*{[^}]*color: var\(--sh-tone\);/s);
	assert.match(component, /\.sh-uppercase :global\(\.sh-title\)\s*{[^}]*text-transform: uppercase;/s);
});
