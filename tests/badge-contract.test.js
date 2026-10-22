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
	assert.match(badge, /class:badge-ok=\{t === 'ok'\}/);
	assert.match(badge, /class:badge-info=\{t === 'info'\}/);
});

test('Badge tone vocabulary gains accent, muted and violet mapped to theme tokens', () => {
	assert.match(badge, /type Tone = SharedTone \| 'muted' \| 'violet';/);
	assert.match(badge, /accent: 'var\(--accent\)'/);
	assert.match(badge, /muted: 'var\(--text-muted\)'/);
	assert.match(badge, /violet: 'var\(--c-violet\)'/);
});

test('Badge color overrides tone and every tint derives from --badge-tone', () => {
	assert.match(badge, /color\?: string;/);
	assert.match(badge, /color \?\? \(t === 'neutral' \? undefined : TONE_COLOR\[t\]\)/);
	assert.match(badge, /style:--badge-tone=\{toneColor\}/);
	assert.match(css, /\.toned \{\s*color: var\(--badge-fg, color-mix\(in oklab, var\(--badge-tone\) 75%, var\(--text\)\)\);/);
	assert.match(css, /color-mix\(in srgb, var\(--badge-tone\) 40%, transparent\)/);
	assert.match(css, /color-mix\(in srgb, var\(--badge-tone\) 12%, transparent\)/);
	assert.match(css, /\.active \{[^}]*background: var\(--badge-tone, var\(--accent\)\)/);
	assert.doesNotMatch(css, /--badge-fill/);
});

test('Badge size adds xs and derives sm/xs font from the --fs-xs token', () => {
	assert.match(badge, /size\?: 'xs' \| 'sm' \| 'md';/);
	assert.match(badge, /class:badge-xs=\{size === 'xs'\}/);
	assert.match(css, /\.badge-sm,\s*\.badge-xs \{\s*font-size: var\(--badge-fs, var\(--fs-xs\)\);/);
	assert.match(css, /\.badge-xs \{\s*--badge-h: var\(--chip-xs\);/);
	assert.doesNotMatch(css, /0\.6875rem/);
});

test('Badge numeric uses tabular digits with a centred minimum width', () => {
	assert.match(badge, /numeric = false/);
	assert.match(
		css,
		/\.numeric \{\s*font-variant-numeric: tabular-nums;\s*min-width: var\(--badge-min-size, 1\.5em\);\s*min-height: var\(--badge-min-size, var\(--badge-h\)\);\s*justify-content: center;/
	);
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
	assert.match(css, /\.text \{\s*min-height: 0;\s*padding: 0;\s*border-color: transparent;\s*background: none;/);
});

test('Badge renders a leading Dot in the badge colour and a registered Icon', () => {
	assert.match(badge, /import Dot from '\.\/Dot\.svelte'/);
	assert.match(badge, /import Icon, \{ type IconName \} from '\.\/Icon\.svelte'/);
	assert.match(badge, /icon\?: IconName;/);
	assert.match(badge, /\{#if dot\}\s*<Dot color="var\(--badge-tone, currentColor\)" \/>/);
	assert.match(badge, /\{#if icon\}\s*<Icon name=\{icon\} \/>/);
});

test('Interactive Badge shows a tone-derived focus ring', () => {
	assert.match(css, /\.interactive:focus-visible \{\s*outline: var\(--focus-ring-width\) solid var\(--badge-tone, var\(--accent\)\);/);
});

test('Badge sm/xs font stays on the token scale', () => {
	assert.doesNotMatch(css, /calc\(var\(--fs-xs\) \*/);
});

test('Badge accepts the shared Tone, with success aliased to ok', () => {
	assert.match(badge, /import \{ canonicalTone, type Tone as SharedTone \} from '\$lib\/tone';/);
	assert.match(badge, /const t = \$derived\(canonicalTone\(tone\)\);/);
	assert.match(badge, /Record<Exclude<Tone, 'neutral' \| 'success'>, string>/);
	assert.doesNotMatch(badge, /tone === '(ok|warn|danger|info)'/);
});
