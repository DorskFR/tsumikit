import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/layouts/ResizablePanel.svelte', import.meta.url),
	'utf8'
);

test('collapse control is a subtle inner-edge chevron handle, not a filled button', () => {
	assert.match(source, /\.panel-layout\.collapsed\s*{\s*--panel-current-width: 0px;/);
	assert.match(source, /\.collapse-control\s*{[^}]*position: absolute;/s);
	assert.match(source, /\.collapse-control\s*{[^}]*left: var\(--sp-1\);/s);
	assert.match(source, /\.right \.collapse-control\s*{[^}]*right: var\(--sp-1\);/s);
	assert.match(source, /\.collapse-control\s*{[^}]*background: transparent;/s);
	assert.doesNotMatch(source, /--panel-collapsed-width/);
	assert.match(source, /aria-label={toggleLabel}/);
	assert.match(source, /collapsed \? `Expand \$\{label\}` : `Collapse \$\{label\}`/);
});

test('collapse handle placement is selectable and sticks to the viewport via rAF', () => {
	assert.match(source, /handlePlacement = 'bottom'/);
	assert.match(source, /handlePlacement\?: 'top' \| 'bottom'/);
	assert.match(source, /stickyHandle = true/);
	assert.match(source, /class:top={handlePlacement === 'top'}/);
	assert.match(source, /class:bottom={handlePlacement === 'bottom'}/);
	assert.match(source, /\.collapse-control\.top\s*{[^}]*top: var\(--sp-2\);/s);
	assert.match(source, /\.collapse-control\.bottom\s*{[^}]*bottom: var\(--sp-2\);/s);
	assert.match(source, /requestAnimationFrame\(\(\) => {[\s\S]*computeSticky\(\)/);
	assert.match(source, /addEventListener\('scroll', scheduleSticky, true\)/);
	assert.match(source, /style="transform: translateY\({stickyShift}px\)"/);
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
