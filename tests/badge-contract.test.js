import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const badge = await readFile(
	new URL('../src/lib/components/atoms/Badge.svelte', import.meta.url),
	'utf8'
);
const css = badge.slice(badge.indexOf('<style>'));

test('Badge keeps its existing props and defaults', () => {
	assert.match(badge, /tone = 'neutral'/);
	assert.match(badge, /as = 'span'/);
	assert.match(badge, /size = 'md'/);
	assert.match(badge, /border = true/);
	assert.match(badge, /active = false/);
	assert.match(badge, /removable = false/);
	assert.match(badge, /class:badge-ok=\{tone === 'ok'\}/);
	assert.match(badge, /class:badge-info=\{tone === 'info'\}/);
});

test('Badge tone vocabulary gains accent, muted and violet mapped to theme tokens', () => {
	assert.match(badge, /type Tone = 'neutral' \| 'ok' \| 'warn' \| 'danger' \| 'info' \| 'accent' \| 'muted' \| 'violet'/);
	assert.match(badge, /accent: 'var\(--accent\)'/);
	assert.match(badge, /muted: 'var\(--text-muted\)'/);
	assert.match(badge, /violet: 'var\(--c-violet\)'/);
});

test('Badge color overrides tone and every tint derives from --badge-tone', () => {
	assert.match(badge, /color\?: string;/);
	assert.match(badge, /color \?\? \(tone === 'neutral' \? undefined : TONE_COLOR\[tone\]\)/);
	assert.match(badge, /style:--badge-tone=\{toneColor\}/);
	assert.match(css, /\.toned \{\s*color: var\(--badge-tone\);/);
	assert.match(css, /color-mix\(in srgb, var\(--badge-tone\) 40%, transparent\)/);
	assert.match(css, /color-mix\(in srgb, var\(--badge-tone\) 12%, transparent\)/);
	assert.match(css, /\.active \{[^}]*background: var\(--badge-tone, var\(--accent\)\)/);
	assert.doesNotMatch(css, /--badge-fill/);
});

test('Badge size adds xs and derives sm/xs font from the --fs-xs token', () => {
	assert.match(badge, /size\?: 'xs' \| 'sm' \| 'md';/);
	assert.match(badge, /class:badge-xs=\{size === 'xs'\}/);
	assert.match(css, /\.badge-sm,\s*\.badge-xs \{\s*font-size: calc\(var\(--fs-xs\) \* 0\.92\);/);
	assert.match(css, /\.badge-xs \{\s*padding: 0\.05rem var\(--sp-2\);/);
	assert.doesNotMatch(css, /0\.6875rem/);
});

test('Badge numeric uses tabular digits with a centred minimum width', () => {
	assert.match(badge, /numeric = false/);
	assert.match(css, /\.numeric \{\s*font-variant-numeric: tabular-nums;\s*min-width: 1\.5em;\s*justify-content: center;/);
});

test('Badge truncate clips children with an ellipsis and maxWidth sets the cap', () => {
	assert.match(badge, /truncate = false/);
	assert.match(badge, /maxWidth\?: string;/);
	assert.match(badge, /style:--badge-max-width=\{maxWidth\}/);
	assert.match(css, /max-width: var\(--badge-max-width, 100%\)/);
	assert.match(badge, /\{#if truncate\}\s*<span class="clip">\{@render children\?\.\(\)\}<\/span>/);
	assert.match(css, /\.clip \{\s*min-width: 0;\s*overflow: hidden;\s*text-overflow: ellipsis;\s*white-space: nowrap;/);
});

test('Badge variant="text" drops the chip chrome', () => {
	assert.match(badge, /variant = 'chip'/);
	assert.match(badge, /variant\?: 'chip' \| 'text';/);
	assert.match(badge, /class:text=\{variant === 'text'\}/);
	assert.match(css, /\.text \{\s*padding: 0;\s*border-color: transparent;\s*background: none;/);
});

test('Badge renders a leading Dot in the badge colour and a registered Icon', () => {
	assert.match(badge, /import Dot from '\.\/Dot\.svelte'/);
	assert.match(badge, /import Icon, \{ type IconName \} from '\.\/Icon\.svelte'/);
	assert.match(badge, /icon\?: IconName;/);
	assert.match(badge, /\{#if dot\}\s*<Dot color="var\(--badge-tone, currentColor\)" \/>/);
	assert.match(badge, /\{#if icon\}\s*<Icon name=\{icon\} \/>/);
});

test('Interactive Badge shows a tone-derived focus ring', () => {
	assert.match(css, /\.interactive:focus-visible \{\s*outline: 2px solid var\(--badge-tone, var\(--accent\)\);/);
});
