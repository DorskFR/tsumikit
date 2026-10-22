import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const names = [
	'Accordion',
	'AttachmentList',
	'Breadcrumb',
	'Callout',
	'CapBar',
	'Carousel',
	'ChatBubble',
	'CodeBlock',
	'Combobox',
	'Composer',
	'ConfirmModal',
	'CopyButton',
	'Disclosure',
	'Drawer',
	'Dropzone',
	'EmojiPicker',
	'EmptyState',
	'Field',
	'Fieldset',
	'FileButton',
	'FilterInput',
	'FontScalePicker',
	'GitRef',
	'GlyphStack',
	'IconButton',
	'InputGroup',
	'KeyValue',
	'LoadMore',
	'Menu',
	'Meter',
	'Metric',
	'Modal'
];

const src = Object.fromEntries(
	await Promise.all(
		names.map(async (n) => [
			n,
			await readFile(new URL(`../src/lib/components/molecules/${n}.svelte`, import.meta.url), 'utf8')
		])
	)
);

// ChatBubble tints its edge with the role colour via color-mix; no role token reproduces it.
const allowed = { ChatBubble: 1 };

test('no hardcoded 1px border/border-strong edges remain in molecules A–M', () => {
	for (const n of names) {
		const hits = src[n].match(/1px solid (color-mix\([^;]*)?var\(--border(-strong)?\b/g) ?? [];
		assert.equal(hits.length, allowed[n] ?? 0, `${n}: ${hits.join(' | ')}`);
	}
});

test('surfaces read the surface tokens', () => {
	assert.match(src.Accordion, /\.accordion {\s*border: var\(--edge-width\) solid var\(--surface-edge\);/);
	assert.match(src.Accordion, /border-top: var\(--edge-width\) solid var\(--surface-edge\);/);
	assert.match(src.CodeBlock, /\.codeblock {[^}]*border: var\(--edge-width\) solid var\(--surface-edge\);/);
	assert.match(src.CodeBlock, /\.cb-head {[^}]*background: var\(--surface-fill-2\);\s*border-bottom: var\(--edge-width\) solid var\(--surface-edge\);/);
	assert.match(src.CodeBlock, /\.cb-gutter {[^}]*background: var\(--surface-fill\);\s*border-right: var\(--edge-width\) solid var\(--surface-edge\);/);
	assert.match(src.GitRef, /background: var\(--surface-fill-2\);[^}]*border: var\(--edge-width\) solid var\(--surface-edge\);/);
	assert.match(src.AttachmentList, /\.preview {[^}]*border: var\(--edge-width\) solid var\(--surface-edge\);/);
	assert.match(src.AttachmentList, /border: var\(--edge-width\) solid var\(--surface-edge-strong\);/);
});

test('raised panels and the drawer read the raised/overlay tokens', () => {
	assert.match(src.Combobox, /background: var\(--cb-bg, var\(--raised-fill\)\);/);
	assert.match(src.Combobox, /border: var\(--edge-width\) solid var\(--cb-border, var\(--raised-edge\)\);/);
	assert.match(src.Combobox, /box-shadow: var\(--raised-shadow\);/);
	assert.match(src.GlyphStack, /\.expand-panel {[^}]*background: var\(--raised-fill\);[^}]*box-shadow: var\(--raised-shadow\);/);
	assert.match(src.FilterInput, /background: var\(--raised-fill\);\s*border: var\(--edge-width\) solid var\(--raised-edge\);/);
	assert.match(src.Drawer, /background: var\(--overlay-fill\);/);
	assert.match(src.Drawer, /border-left: var\(--edge-width\) solid var\(--border-strong\);\s*box-shadow: var\(--overlay-shadow\);/);
	assert.equal(src.Drawer.match(/solid var\(--surface-edge\)/g)?.length, 4);
});

test('controls and tracks read the control/track tokens', () => {
	assert.match(src.InputGroup, /background: var\(--textarea-bg, var\(--control-fill\)\);\s*border: var\(--edge-width\) solid var\(--textarea-border, var\(--control-edge\)\);/);
	assert.match(src.FilterInput, /\.fi__bar {[^}]*border: var\(--edge-width\) solid var\(--control-edge\);/);
	assert.match(src.CapBar, /box-shadow: inset 0 0 0 var\(--edge-width\) var\(--track-edge\);/);
});

test('FileButton reads the button tokens and the hover/focus hooks', () => {
	const fb = src.FileButton;
	assert.match(fb, /border: var\(--edge-width\) solid var\(--btn-edge\);[^}]*background: var\(--btn-fill\);/);
	assert.match(fb, /\.file-btn\.primary {\s*background: var\(--btn-primary-fill\);\s*border-color: var\(--btn-primary-edge\);/);
	assert.match(fb, /box-shadow: var\(--file-shadow-rest\), var\(--focus-glow\);/);
	assert.match(fb, /\.file-btn:hover:not\(\.disabled\) {[^}]*translate: 0 calc\(-1 \* var\(--hover-lift\)\);\s*--file-shadow-rest: var\(--file-shadow-lift\);/);
	assert.match(fb, /translate var\(--dur-fast\) var\(--ease-out\),/);
	assert.doesNotMatch(fb, /transition: all/);
});
