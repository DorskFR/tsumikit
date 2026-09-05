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

test('resize handle overhang clamps to the container so it stays grabbable at full width', () => {
	assert.match(
		source,
		/--handle-shift: max\(-6px, calc\(var\(--panel-current-width\) - 100cqw\)\);/
	);
	assert.match(source, /\.resize-handle\s*{[^}]*right: var\(--handle-shift\);/s);
	assert.match(source, /\.resize-handle\s*{[^}]*width: calc\(18px \+ var\(--handle-shift\)\);/s);
	assert.match(source, /\.right \.resize-handle\s*{[^}]*left: var\(--handle-shift\);/s);
});

test('resize handle spans the full panel edge and delegates drag + keys to the shared action', () => {
	assert.match(source, /\.resize-handle\s*{[^}]*top: 0;[^}]*bottom: 0;/s);
	assert.match(source, /import { resizeHandle, resolveLength } from '\.\/resizable-panel-frame\.js'/);
	assert.match(source, /use:resizeHandle={{[^}]*step: resizeStep,/s);
	assert.match(source, /use:resizeHandle={{[^}]*onwidth: setWidth,/s);
	assert.match(source, /use:resizeHandle={{[^}]*oncommit: persistWidth,/s);
	assert.match(source, /localStorage\.setItem\(widthKey, String\(nextWidth\)\)/);
	assert.doesNotMatch(source, /onpointerdown=/);
});

test('inline defaults are unchanged so existing usages render as before', () => {
	assert.match(source, /side = 'left'/);
	assert.match(source, /width = 280/);
	assert.match(source, /minWidth = 180/);
	assert.match(source, /maxWidth = 480/);
	assert.match(source, /collapsed = \$bindable\(false\)/);
	assert.match(source, /persistCollapsed = true/);
	assert.match(source, /resizeStep = 16/);
	assert.match(source, /mode = 'inline'/);
	assert.match(source, /open = \$bindable\(false\)/);
	assert.match(source, /clampToViewport = true/);
	assert.match(source, /minWidth\?: number \| string/);
	assert.match(source, /maxWidth\?: number \| string/);
	assert.match(source, /children\?: Snippet/);
});

test('overlay mode is a fixed non-modal dialog with scrim, Escape close and focus handling', () => {
	assert.match(source, /mode\?: 'inline' \| 'overlay'/);
	assert.match(source, /onclose\?: \(\) => void/);
	assert.match(source, /scrim\?: boolean/);
	assert.match(source, /fullWidthBelow\?: string/);
	assert.match(source, /const showScrim = \$derived\(overlay && open && \(scrim \?\? true\)\)/);
	assert.match(source, /<Scrim onclose={close} hideBelow={fullWidthBelow}/);
	assert.match(source, /this={overlay \? 'div' : 'aside'}/);
	assert.match(source, /role={overlay \? 'dialog' : undefined}/);
	assert.match(source, /aria-modal={overlay \? 'false' : undefined}/);
	assert.match(source, /tabindex={overlay \? -1 : undefined}/);
	assert.match(source, /event\.key !== 'Escape' \|\| event\.defaultPrevented/);
	assert.match(source, /panelEl\.focus\({ preventScroll: true }\)/);
	assert.match(source, /function close\(\) {\s*if \(!open\) return;\s*open = false;\s*onclose\?\.\(\);/);
	assert.match(source, /\.overlay \.panel\s*{[^}]*position: fixed;[^}]*z-index: var\(--z-drawer\);/s);
	assert.match(source, /\.overlay\.full-bleed \.panel\s*{[^}]*width: 100vw;/s);
	assert.match(source, /\.overlay\.full-bleed \.resize-handle\s*{[^}]*display: none;/s);
	assert.match(source, /matchMedia\(`\(max-width: \$\{fullWidthBelow\}\)`\)/);
	assert.match(source, /overlay && clampToViewport && viewportWidth \? viewportWidth : Number\.POSITIVE_INFINITY/);
	assert.match(source, /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.panel\s*{[^}]*animation: none;/s);
});

test('collapseControl defaults on inline and off in overlay mode', () => {
	assert.match(source, /collapseControl\?: boolean/);
	assert.match(source, /const showCollapseControl = \$derived\(collapseControl \?\? !overlay\)/);
	assert.match(source, /{#if showCollapseControl}\s*<button/);
});
