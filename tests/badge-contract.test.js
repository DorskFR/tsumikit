import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const badge = await readFile(
	new URL('../src/lib/components/atoms/Badge.svelte', import.meta.url),
	'utf8'
);
const css = badge.slice(badge.indexOf('<style>'));
const TONES = {
	ok: '--ok',
	warn: '--warn',
	danger: '--danger',
	info: '--info',
	accent: '--accent',
	muted: '--text-muted',
	violet: '--c-violet'
};
/** @param {string} s */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Declaration block of the rule whose selector list is exactly `selector`. @param {string} selector */
const rule = (selector) => css.match(new RegExp(`(?:^|\\})\\s*${esc(selector)} \\{([^}]*)\\}`))?.[1] ?? '';

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

test('Badge tints from root tokens per tone class; color tints inline', () => {
	assert.match(badge, /color\?: string;/);
	assert.match(badge, /color \?\? \(t === 'neutral' \? undefined : TONE_COLOR\[t\]\)/);
	assert.doesNotMatch(badge, /--badge-/);
	assert.doesNotMatch(badge, /--icon-size/);
	for (const [tone, token] of Object.entries(TONES)) {
		assert.match(badge, new RegExp(`class:badge-${tone}=\\{t === '${tone}'\\}`));
		const tint = rule(`.badge-${tone}`);
		assert.ok(tint.includes(`color: color-mix(in oklab, var(${token}) 75%, var(--text));`), tone);
		assert.ok(tint.includes(`border-color: color-mix(in srgb, var(${token}) 40%, transparent);`), tone);
		assert.ok(tint.includes(`background: color-mix(in srgb, var(${token}) 12%, transparent);`), tone);
	}
	assert.match(badge, /`color: color-mix\(in oklab, \$\{color\} 75%, var\(--text\)\);/);
	assert.match(badge, /background: color-mix\(in srgb, \$\{color\} 12%, transparent\);/);
	assert.match(badge, /border-color: color-mix\(in srgb, \$\{color\} 40%, transparent\);/);
	assert.match(badge, /if \(filled\) return `background: \$\{color\}; border-color: \$\{color\};/);
	assert.match(css, /\.active,\s*\.solid \{\s*color: var\(--text-on-accent\);\s*background: var\(--accent\);\s*border-color: var\(--accent\);/);
	assert.match(css, /\.badge :global\(\.icon\) \{\s*font-size: var\(--icon-xs\);/);
});

test('Badge variant="solid" fills the pill with its tone under readable ink', async () => {
	assert.match(badge, /class:solid=\{variant === 'solid'\}/);
	for (const [tone, token] of Object.entries(TONES)) {
		if (tone === 'accent') continue;
		assert.match(
			css,
			new RegExp(`\\.active\\.badge-${tone},\\s*\\.solid\\.badge-${tone} \\{\\s*background: var\\(${token}\\);\\s*border-color: var\\(${token}\\);`)
		);
		assert.match(
			css,
			new RegExp(`\\.interactive\\.active\\.badge-${tone}:hover,\\s*\\.interactive\\.solid\\.badge-${tone}:hover \\{\\s*border-color: var\\(${token}\\);`)
		);
	}
	const { contrast, palettes } = await import('./theme-contrast.mjs');
	const [tokens, themes] = await Promise.all(
		['tokens', 'themes'].map((n) => readFile(new URL(`../src/lib/styles/${n}.css`, import.meta.url), 'utf8'))
	);
	assert.match(tokens, /--text-on-accent: var\(--c-accent-ink\);/);
	const all = Object.entries(palettes(tokens, themes).palettes);
	assert.ok(all.length >= 20);
	for (const [id, p] of all) {
		for (const fill of ['accent', 'green', 'amber', 'red', 'blue', 'violet', 'text-muted']) {
			const c = contrast(p['accent-ink'], p[fill]);
			assert.ok(c >= 4.5, `${id} ${fill}: ${c.toFixed(2)}`);
		}
	}
});

test('Badge size adds xs and derives sm/xs font from the --fs-xs token', () => {
	assert.match(badge, /size\?: 'xs' \| 'sm' \| 'md';/);
	assert.match(badge, /class:badge-xs=\{size === 'xs'\}/);
	assert.match(css, /\.badge-sm,\s*\.badge-xs \{\s*font-size: var\(--fs-xs\);/);
	assert.match(css, /\.badge-xs \{\s*min-height: var\(--chip-xs\);/);
	assert.match(css, /\.badge-sm \{\s*min-height: var\(--chip-sm\);/);
	assert.doesNotMatch(css, /0\.6875rem/);
});

test('Badge numeric uses tabular digits with a centred minimum width', () => {
	assert.match(badge, /numeric = false/);
	assert.match(
		css,
		/\.numeric \{\s*font-variant-numeric: tabular-nums;\s*min-width: 1\.5em;\s*min-height: var\(--chip-md\);\s*justify-content: center;/
	);
	assert.match(css, /\.numeric\.badge-sm \{\s*min-height: var\(--chip-sm\);/);
	assert.match(css, /\.numeric\.badge-xs \{\s*min-height: var\(--chip-xs\);/);
});

test('Badge truncate clips children with an ellipsis and maxWidth sets the cap', () => {
	assert.match(badge, /truncate = false/);
	assert.match(badge, /maxWidth\?: string;/);
	assert.match(badge, /maxWidth \? `max-width: \$\{maxWidth\};` : ''/);
	assert.match(css, /\.badge \{[^}]*max-width: 100%;/);
	assert.match(badge, /\{#if truncate\}\s*<span class="clip">\{@render children\?\.\(\)\}<\/span>/);
	assert.match(css, /\.clip \{\s*min-width: 0;\s*overflow: hidden;\s*text-overflow: ellipsis;\s*white-space: nowrap;/);
});

test('Badge variant="text" drops the chip chrome', () => {
	assert.match(badge, /variant = 'chip'/);
	assert.match(badge, /variant\?: 'chip' \| 'text' \| 'solid';/);
	assert.match(badge, /class:text=\{variant === 'text'\}/);
	assert.match(css, /\.text \{\s*min-height: 0;\s*padding: 0;\s*border-color: transparent;\s*background: none;/);
});

test('Badge renders a leading Dot in the badge colour and a registered Icon', () => {
	assert.match(badge, /import Dot from '\.\/Dot\.svelte'/);
	assert.match(badge, /import Icon, \{ type IconName \} from '\.\/Icon\.svelte'/);
	assert.match(badge, /icon\?: IconName;/);
	assert.match(badge, /\{#if dot\}\s*<Dot color=\{toneColor \?\? 'currentColor'\} \/>/);
	assert.match(badge, /\{#if icon\}\s*<Icon name=\{icon\} \/>/);
});

test('Interactive Badge shows a tone-derived focus ring', () => {
	assert.match(css, /\.interactive:focus-visible \{\s*outline: var\(--focus-ring-width\) solid var\(--accent\);/);
	for (const [tone, token] of Object.entries(TONES)) {
		if (tone === 'accent') continue;
		assert.ok(rule(`.interactive.badge-${tone}:focus-visible`).includes(`outline-color: var(${token});`), tone);
	}
	assert.match(badge, /const ring = clickable \? ` outline-color: \$\{color\};` : '';/);
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
