import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} p */
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
const [slider, fontScale, themePicker, tokens] = await Promise.all([
	read('../src/lib/components/atoms/Slider.svelte'),
	read('../src/lib/components/molecules/FontScalePicker.svelte'),
	read('../src/lib/components/molecules/ThemePicker.svelte'),
	read('../src/lib/styles/tokens.css')
]);

test('Slider ticks: one dot per step, positioned inside the thumb travel, reached dots contrast with the fill', () => {
	assert.match(slider, /ticks\?: boolean \| number\[\]/);
	assert.match(slider, /Array\.from\(\{ length: n \+ 1 \}, \(_, i\) => \+min \+ i \* \+step\)/);
	assert.match(slider, /class="tick" class:reached=\{t <= Number\(value\)\}/);
	assert.match(slider, /left: calc\(0\.6rem \+ \(100% - 1\.2rem\) \* var\(--f\)\);/);
	assert.match(slider, /\.tick\.reached\s*{\s*background: var\(--bg\);/s);
	assert.match(slider, /\.ticks\s*{[^}]*pointer-events: none;/s);
});

test('FontScalePicker: A trigger opens a popover with a tick-marked slider over SCALE_LEVELS and a/A end buttons', () => {
	assert.match(fontScale, /<Popover label="Text size"/);
	assert.match(fontScale, /max=\{SCALE_LEVELS\.length - 1\}/);
	assert.match(fontScale, /step=\{1\}\s*ticks/);
	assert.match(fontScale, /aria-label="Smaller text"[\s\S]*?>a<\/button>/);
	assert.match(fontScale, /aria-label="Larger text"[\s\S]*?>A<\/button>/);
	assert.match(fontScale, /aria-valuetext=\{level\.label\}/);
	assert.doesNotMatch(fontScale, /SelectButton/);
});

test('ThemePicker: popover grid of data-theme scoped 2x2 swatches reading the raw palette, current ringed and pressed', () => {
	assert.match(themePicker, /<span class="swatch" data-theme=\{id\} aria-hidden="true">/);
	assert.match(themePicker, /\.q\.bg\s*{\s*background: var\(--c-bg\);/s);
	assert.match(themePicker, /\.q\.surface\s*{\s*background: var\(--c-surface\);/s);
	assert.match(themePicker, /\.q\.text\s*{\s*background: var\(--c-text\);/s);
	assert.match(themePicker, /\.q\.accent\s*{\s*background: var\(--c-accent\);/s);
	assert.match(themePicker, /aria-pressed=\{t\.id === theme\.current\}/);
	assert.match(themePicker, /class:current=\{t\.id === theme\.current\}/);
	assert.match(themePicker, /\.cell\.current\s*{\s*border-color: var\(--accent\);/s);
	assert.match(themePicker, /\['light', 'dark'\] as const/);
	assert.doesNotMatch(themePicker, /SelectButton/);
});

test('the dark swatch carries the :root palette values (tokens.css stays theme-less)', () => {
	assert.doesNotMatch(tokens.replace(/\/\*[\s\S]*?\*\//g, ''), /\[data-theme/);
	for (const k of ['bg', 'surface', 'text', 'accent']) {
		const root = tokens.match(new RegExp(`^  --c-${k}: (#[0-9a-f]+);`, 'm'))?.[1];
		assert.ok(root, k);
		assert.match(themePicker, new RegExp(`\\.swatch\\[data-theme='dark'\\]\\s*{[^}]*--c-${k}: ${root};`, 's'), k);
	}
});

test('FontScalePicker chrome never uses scaled font tokens, so the panel cannot move under the pointer mid-drag', () => {
	assert.doesNotMatch(fontScale, /var\(--fs-/);
	assert.match(fontScale, /\.panel\s*{[^}]*font-size: 0\.875rem;/s);
});
