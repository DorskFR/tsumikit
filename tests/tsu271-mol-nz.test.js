import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../src/lib/components/', import.meta.url);

async function sources(dir, filter = () => true) {
	const names = (await readdir(new URL(dir, root))).filter((n) => n.endsWith('.svelte') && filter(n));
	return Promise.all(
		names.map(async (n) => [`${dir}${n}`, await readFile(new URL(`${dir}${n}`, root), 'utf8')])
	);
}

const files = Object.fromEntries([
	...(await sources('molecules/', (n) => /^[N-Z]/.test(n))),
	...(await sources('organisms/')),
	...(await sources('layouts/'))
]);

const src = (path) => {
	assert.ok(files[path], `${path} is in the lane`);
	return files[path];
};

const RAW_SHADOW_ALLOWED = {
	'molecules/RadialMenu.svelte': ['var(--shadow-lg)'] // FAB: accent-ringed --bg-elevated-2 disc, matches no role token
};

test('no hardcoded 1px border-token literals remain', () => {
	for (const [path, text] of Object.entries(files)) {
		assert.doesNotMatch(text, /1px (solid|dashed) var\(--border/, path);
	}
});

test('raw --shadow-md/--shadow-lg only where no role token matches', () => {
	for (const [path, text] of Object.entries(files)) {
		const allowed = RAW_SHADOW_ALLOWED[path] ?? [];
		for (const m of text.matchAll(/var\(--shadow-(md|lg)\)/g)) {
			assert.ok(allowed.includes(m[0]), `${path}: ${m[0]}`);
		}
	}
});

test('focus-visible on controls appends the glow and keeps the outline ring', () => {
	for (const path of ['molecules/RichSelect.svelte', 'molecules/RadioGroup.svelte']) {
		assert.match(
			src(path),
			/:focus-visible[^{]*{\s*outline: var\(--focus-ring\);\s*outline-offset: var\(--focus-ring-offset\);\s*box-shadow: var\(--control-shadow\), var\(--focus-glow\);/,
			path
		);
	}
});

const USES = {
	'molecules/OptionButton.svelte': ['--control-fill', '--control-edge', '--control-shadow', '--hover-lift'],
	'molecules/Pagination.svelte': ['--edge-width', '--hover-lift'],
	'molecules/Popover.svelte': [
		'--btn-fill',
		'--btn-edge',
		'--btn-shadow',
		'--btn-shadow-hover',
		'--btn-primary-fill',
		'--btn-primary-edge',
		'--btn-primary-shadow',
		'--btn-primary-shadow-hover',
		'--raised-fill',
		'--raised-shadow',
		'--hover-lift'
	],
	'molecules/Prose.svelte': ['--surface-fill', '--surface-fill-2', '--surface-edge'],
	'molecules/RadialMenu.svelte': ['--raised-fill', '--raised-shadow', '--edge-width'],
	'molecules/RadioGroup.svelte': ['--control-fill', '--control-edge', '--control-shadow', '--surface-edge', '--surface-fill', '--focus-glow'],
	'molecules/RichSelect.svelte': ['--control-edge', '--control-shadow', '--raised-fill', '--raised-shadow', '--surface-edge', '--focus-glow'],
	'molecules/SectionHeader.svelte': ['--surface-edge'],
	'molecules/SeekSlider.svelte': ['--track-fill', '--thumb-shadow', '--raised-fill', '--surface-edge', '--raised-shadow'],
	'molecules/SegmentedControl.svelte': ['--track-fill', '--track-edge', '--thumb-fill', '--thumb-shadow', '--edge-width'],
	'molecules/SortableList.svelte': ['--surface-edge', '--raised-shadow'],
	'molecules/SplitButton.svelte': ['--edge-width'],
	'molecules/Tabs.svelte': ['--surface-edge', '--edge-width'],
	'molecules/ThemePicker.svelte': ['--surface-edge'],
	'molecules/Timestamp.svelte': ['--btn-edge'],
	'molecules/Toggle.svelte': ['--surface-fill-2', '--surface-edge', '--surface-edge-strong', '--hover-lift'],
	'molecules/Tooltip.svelte': ['--raised-shadow', '--edge-width'],
	'molecules/VolumeSlider.svelte': ['--track-fill', '--thumb-shadow'],
	'organisms/ConversationFeed.svelte': ['--raised-shadow'],
	'organisms/ConversationPanel.svelte': ['--surface-edge'],
	'organisms/DataTable.svelte': ['--surface-edge', '--surface-fill-2'],
	'layouts/AppShell.svelte': ['--surface-fill', '--surface-edge', '--overlay-shadow'],
	'layouts/MasterDetail.svelte': ['--surface-edge'],
	'layouts/NavBar.svelte': ['--surface-edge', '--raised-fill', '--raised-shadow'],
	'layouts/NavSection.svelte': ['--surface-edge'],
	'layouts/ResizablePanel.svelte': ['--surface-fill', '--surface-edge', '--raised-shadow'],
	'layouts/TabBar.svelte': ['--surface-fill', '--surface-edge']
};

for (const [path, tokens] of Object.entries(USES)) {
	test(`${path} reads the structural role tokens`, () => {
		const text = src(path);
		for (const t of tokens) assert.ok(text.includes(`var(${t})`), `${path} uses ${t}`);
	});
}

test('per-component hooks stay the first fallback', () => {
	const pop = src('molecules/Popover.svelte');
	assert.match(pop, /border-color: var\(--pop-trigger-border, var\(--btn-edge\)\);/);
	assert.match(pop, /background: var\(--pop-trigger-bg, var\(--btn-fill\)\);/);
	assert.match(pop, /background: var\(--pop-trigger-bg, var\(--btn-primary-fill\)\);/);
	assert.match(src('molecules/Prose.svelte'), /background: var\(--md-code-bg, var\(--surface-fill-2\)\);/);
	assert.match(
		src('layouts/MasterDetail.svelte'),
		/border-right: var\(--md-divider, var\(--edge-width\) solid var\(--surface-edge\)\);/
	);
});

test('hover lift lives inside the fine-pointer hover block and is transitioned', () => {
	for (const path of ['molecules/OptionButton.svelte', 'molecules/Pagination.svelte', 'molecules/Toggle.svelte', 'molecules/Popover.svelte']) {
		const text = src(path);
		const hover = text.slice(text.indexOf('@media (hover: hover) and (pointer: fine)'));
		assert.match(hover, /translate: 0 calc\(-1 \* var\(--hover-lift\)\);/, path);
		assert.match(text, /\n\t\t\ttranslate var\(--dur-fast\)/, path);
		assert.doesNotMatch(text, /transition: all/, path);
	}
});
