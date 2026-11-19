import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
	new URL('../src/lib/components/molecules/Modal.svelte', import.meta.url),
	'utf8'
);

test('Modal keeps mount-to-open by default and follows a bound `open` when provided', () => {
	assert.match(source, /open = \$bindable\(\)/);
	assert.match(source, /open\?: boolean;/);
	assert.match(source, /onclose\?: \(\) => void;/);
	assert.match(source, /const controlled = \$derived\(open !== undefined\);/);
	assert.match(source, /if \(!controlled\) {\s*showModalUnscrolled\(dialogEl\);\s*return;\s*}/s);
	assert.match(source, /if \(open && !dialogEl\.open\) {\s*showModalUnscrolled\(dialogEl\);\s*if \(synced\) playSound\('open', sound\);\s*}/);
	assert.match(source, /else if \(!open && dialogEl\.open\) dialogEl\.close\(\);/);
	assert.match(source, /function requestClose\(\) {\s*if \(busy\) return;\s*if \(controlled\) open = false;\s*else {\s*dismissed = true;\s*playSound\('close', sound\);\s*}\s*onclose\?\.\(\);/s);
	assert.match(source, /function onDialogClose\(\) {\s*const forced = controlled \? open : !dismissed;\s*dismissed = false;\s*if \(controlled\) open = false;\s*if \(controlled \|\| forced\) playSound\('close', sound\);\s*if \(forced\) onclose\?\.\(\);/s);
	assert.match(source, /onclose={onDialogClose}/);
});

test('Modal busy makes the body inert, shows a spinner and blocks every close path it can', () => {
	assert.match(source, /busy\?: boolean;/);
	assert.match(source, /A close\s*\*\s*the browser forces \(repeated Escape, Android back\) still closes and\s*\*\s*calls `onclose`\./);
	assert.match(source, /aria-busy={busy \|\| undefined}/);
	assert.match(source, /<div class="sheet-body" inert={busy}>/);
	assert.match(source, /{#if busy}<Spinner label="Working" \/>{\/if}/);
	assert.match(source, /<IconButton icon="x" label="Close dialog" disabled={busy} onclick={requestClose} \/>/);
	assert.match(source, /oncancel={\(e\) => {\s*e\.preventDefault\(\);[^}]*requestClose\(\);/s);
	assert.match(source, /pressOnBackdrop = e\.target === dialogEl;/);
	assert.match(source, /const outside = pressOnBackdrop && e\.target === dialogEl;\s*pressOnBackdrop = false;\s*if \(outside\) requestClose\(\);/s);
	assert.match(source, /onpointerdown={onDialogPointerDown}\s*onclick={onDialogClick}/);
});

test('Modal tone paints a title glyph and a 3px top border; footer is right-aligned', () => {
	assert.match(source, /tone\?: Tone;/);
	assert.match(source, /import { canonicalTone, type Tone } from '\$lib\/tone';/);
	assert.match(source, /class:sheet-toned={t !== 'neutral'}/);
	assert.match(source, /const toneColor = \$derived\(t === 'neutral' \? undefined : `var\(--\${t}\)`\);/);
	assert.match(source, /style:border-top-color={toneColor}/);
	assert.match(source, /<span class="sheet-tone-icon" style:color={toneColor}><Icon name=\{TONE_ICON\[t\]\} \/><\/span>/);
	assert.doesNotMatch(source, /--modal-tone/);
	assert.match(source, /\.sheet-tone-icon\s*{[^}]*font-size: var\(--icon-lg\);/);
	assert.match(source, /\.sheet-toned\s*{\s*border-top-width: 3px;/s);
	assert.match(source, /\.sheet-foot\s*{[^}]*justify-content: flex-end;[^}]*gap: var\(--sp-2\);/s);
});

test('Modal stays hidden while closed under a controlled `open`', () => {
	assert.match(source, /\.modal:not\(\[open\]\)\s*{\s*display: none;/s);
});

test('Modal width presets and the resized width are real properties, full-width below 40rem', () => {
	assert.match(source, /style:width={width != null \? `\${width}px` : undefined}/);
	assert.match(source, /style:max-width={width != null \? `min\(\${width}px, calc\(100vw - 2rem\)\)` : undefined}/);
	assert.match(
		source,
		/@media \(max-width: 39\.999rem\)\s*{\s*\.sheet\s*{\s*width: 100% !important;\s*max-width: 34rem !important;/
	);
	for (const [cls, w] of [['sheet-sm', '24rem'], ['sheet-lg', '48rem'], ['sheet-xl', '72rem']]) {
		assert.match(source, new RegExp(`\\.${cls}\\s*{\\s*width: ${w};\\s*max-width: min\\(${w}, calc\\(100vw - 2rem\\)\\);`));
	}
	assert.doesNotMatch(source, /--sw\b|--sheet-w/);
});
