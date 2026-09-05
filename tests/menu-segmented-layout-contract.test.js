import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} name */
const component = (name) =>
	readFile(new URL(`../src/lib/components/molecules/${name}`, import.meta.url), 'utf8');
const [menu, segmented] = await Promise.all([component('Menu.svelte'), component('SegmentedControl.svelte')]);

const chrome = [
	'variant',
	'tone',
	'size',
	'box',
	'control',
	'block',
	'triggerClass',
	'bare',
	'hitArea',
	'disabled',
	'gap',
	'onopen',
	'onclose'
];

test('Menu picks its trigger chrome prop types from Popover', () => {
	assert.match(menu, /import type \{ ComponentProps, Snippet \} from 'svelte'/);
	assert.match(menu, /type PopoverProps = ComponentProps<typeof Popover>/);
	for (const p of chrome) {
		assert.match(menu, new RegExp(`\\| '${p}'`), `${p} picked from PopoverProps`);
	}
});

test('Menu destructures and forwards every chrome prop to Popover', () => {
	const popoverTag = menu.slice(menu.indexOf('<Popover'), menu.indexOf('\n>', menu.indexOf('<Popover')));
	for (const p of chrome.filter((p) => p !== 'onopen' && p !== 'onclose')) {
		assert.match(menu, new RegExp(`^\\t\\t${p}[,\\n]`, 'm'), `${p} destructured`);
		assert.match(popoverTag, new RegExp(`\\{${p}\\}`), `${p} forwarded`);
	}
	assert.match(popoverTag, /onclose=\{\(\) => \{\s*open = false;\s*onclose\?\.\(\);\s*\}\}/);
	assert.match(popoverTag, /onopen=\{\(\) => \{\s*open = true;\s*queueMicrotask\(\(\) => focusAt\(0\)\);\s*onopen\?\.\(\);\s*\}\}/);
});

test('Menu keeps its original props', () => {
	for (const p of ['label', 'items', 'trigger', 'placement']) {
		assert.match(menu, new RegExp(`\\b${p}\\??:`));
	}
});

test('SegmentedControl collapseLabels accepts container with a fixed 35rem container query', () => {
	assert.match(segmented, /collapseLabels\?: 'never' \| 'mobile' \| 'container'/);
	assert.match(segmented, /class:collapse-container=\{collapseLabels === 'container'\}/);
	assert.match(
		segmented,
		/@container \(max-width: 35rem\)\s*{\s*\.collapse-container \.seg-item\.has-label \.seg-label\s*{\s*display: none;/
	);
	assert.match(segmented, /\.collapse-container \.seg-item\.has-label\s*{\s*gap: 0;\s*padding: 0\.35rem;/);
	assert.doesNotMatch(segmented, /collapseAt/);
});

test('the existing mobile media collapse rule is unchanged', () => {
	assert.match(segmented, /class:seg-collapse-mobile=\{collapseLabels === 'mobile'\}/);
	assert.match(
		segmented,
		/@media \(max-width: 47\.999rem\)\s*{\s*\.seg-collapse-mobile \.seg-item\.has-label \.seg-label\s*{\s*display: none;/
	);
});

test('scroll renders a non-wrapping horizontally scrolling row with the scrollbar hidden', () => {
	assert.match(segmented, /scroll\?: boolean/);
	assert.match(segmented, /class:seg-scroll=\{scroll\}/);
	const rule = segmented.match(/\.seg-scroll\s*{([^}]*)}/s);
	assert.ok(rule);
	for (const decl of [
		'overflow-x: auto',
		'scrollbar-width: none',
		'flex: 1 0 100%',
		'flex-wrap: nowrap',
		'-webkit-overflow-scrolling: touch'
	]) {
		assert.ok(rule[1].includes(decl), decl);
	}
	assert.match(segmented, /\.seg-scroll::-webkit-scrollbar\s*{\s*display: none;/);
	assert.match(segmented, /\.seg-scroll \.seg-item\s*{\s*flex: none;/);
});

test('block fills the parent width and shares it equally between segments', () => {
	assert.match(segmented, /block\?: boolean/);
	assert.match(segmented, /class:seg-block=\{block\}/);
	assert.match(segmented, /\.seg-block\s*{\s*display: flex;\s*width: 100%;/);
	assert.match(segmented, /\.seg-block \.seg-item\s*{\s*flex: 1 1 0;\s*justify-content: center;/);
});
