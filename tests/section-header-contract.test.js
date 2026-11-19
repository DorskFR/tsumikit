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

test('title is a Heading at the given level; count is muted, normal-weight tabular Text', () => {
	assert.match(component, /<Heading {level} {size} class="sh-title">{text}<\/Heading>/);
	assert.match(component, /<Heading {level} {size} class="sh-title">\s*<button\s+type="button"\s+class="sh-toggle"/);
	assert.match(component, /<Text tone="muted" weight="normal" numeric class="sh-count">{count}<\/Text>/);
	assert.match(component, /<Text variant="caption" class="sh-subtitle">{subtitle}<\/Text>/);
});

test('hue renders a swatch chip coloured inline; icon glyphs resolve from the registry', () => {
	assert.match(component, /{#if hue !== undefined}\s*<span class="sh-swatch" style:background="hsl\({hue} 70% 55%\)" aria-hidden="true">/);
	assert.doesNotMatch(component, /--sh-hue/);
	assert.match(component, /<Icon name="chevron-right" class="sh-chevron" \/>/);
	assert.match(icon, /^\s+'chevron-right': '/m);
});

test('layout: wrapping flex row, actions pushed to the inline end, divider underlines the row', () => {
	assert.match(component, /\.sh-row\s*{[^}]*display: flex;[^}]*align-items: center;[^}]*gap: var\(--sp-3\);[^}]*flex-wrap: wrap;/s);
	assert.match(component, /\.sh-actions\s*{[^}]*margin-inline-start: auto;/s);
	assert.match(component, /class:sh-divider={divider}/);
	assert.match(component, /\.sh-divider > \.sh-row\s*{[^}]*border-bottom: var\(--edge-width\) solid var\(--surface-edge\);/s);
});

test('sticky pins under the app header and publishes --section-header-h on the parent', () => {
	assert.match(component, /class:sh-sticky={sticky}/);
	assert.match(component, /\.sh-sticky\s*{[^}]*position: sticky;[^}]*top: var\(--sticky-offset, var\(--header-h\)\);[^}]*background: var\(--bg\);/s);
	assert.match(component, /bind:offsetHeight={height}/);
	assert.match(component, /parent\.style\.setProperty\('--section-header-h', `\$\{height\}px`\)/);
	assert.match(component, /parent\.style\.removeProperty\('--section-header-h'\)/);
});

test('collapsible turns the title into a disclosure button controlling the children panel', () => {
	assert.match(component, /<button\s+type="button"\s+class="sh-toggle"\s+aria-expanded={open}\s+aria-controls={children \? panelId : undefined}\s+onclick={\(\) => setOpen\(!open\)}/);
	assert.match(component, /hidden={!collapsible \|\| open \? undefined : rendered \? 'until-found' : true}\s+onbeforematch={collapsible \? \(\) => setOpen\(true\) : undefined}/);
	assert.match(component, /<div class="sh-body">\s*{#if rendered}{@render children\(\)}{\/if}\s*<\/div>/);
	assert.match(component, /\.sh-open :global\(\.sh-chevron\)\s*{\s*rotate: 90deg;/);
});

test('each tone tints the title and icon from its semantic token', () => {
	for (const t of ['ok', 'warn', 'danger', 'info', 'accent']) {
		assert.match(component, new RegExp(`\\.sh-${t} :global\\(\\.sh-title\\)\\s*{\\s*color: var\\(--${t}\\);`));
		assert.match(component, new RegExp(`\\.sh-${t} \\.sh-icon\\s*{\\s*color: var\\(--${t}\\);`));
	}
	for (const t of ['ok', 'warn', 'danger', 'info']) {
		assert.match(component, new RegExp(`\\.sh-${t}\\.sh-uppercase :global\\(\\.sh-title\\)\\s*{\\s*color: var\\(--${t}\\);`));
	}
	assert.doesNotMatch(component, /\.sh-accent\.sh-uppercase/);
	assert.match(component, /\.section-header :global\(\.sh-title\)\s*{[^}]*color: var\(--text\);/s);
	assert.doesNotMatch(component, /--sh-tone/);
	assert.match(component, /\.sh-uppercase :global\(\.sh-title\)\s*{[^}]*text-transform: uppercase;/s);
});
