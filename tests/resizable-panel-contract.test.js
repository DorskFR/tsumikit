import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/layouts/ResizablePanel.svelte', import.meta.url),
	'utf8'
);

test('collapse control is a compact boundary-attached square with no reserved rail', () => {
	assert.match(source, /\.panel-layout\.collapsed\s*{\s*--panel-current-width: 0px;/);
	assert.match(source, /\.collapse-control\s*{[^}]*position: absolute;/s);
	assert.match(source, /\.collapse-control\s*{[^}]*right: calc\(-1 \* var\(--control-height\)\);/s);
	assert.match(source, /\.collapse-control\s*{[^}]*width: var\(--control-height\);[^}]*height: var\(--control-height\);/s);
	assert.match(source, /\.right \.collapse-control\s*{[^}]*left: calc\(-1 \* var\(--control-height\)\);/s);
	assert.doesNotMatch(source, /--panel-collapsed-width/);
});

test('resize handle spans the full panel edge and pointer updates use frame batching', () => {
	assert.match(source, /\.resize-handle\s*{[^}]*top: 0;[^}]*bottom: 0;/s);
	assert.match(source, /pointerWidths\.schedule\(widthFromPointer\(event\.clientX\)\)/);
	assert.match(
		source,
		/pointerWidths\.flush\(finalWidth\)[\s\S]*localStorage\.setItem\(widthKey, String\(finalWidth\)\)/
	);
	assert.match(source, /onpointercancel={finishResize}/);
});
