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
	assert.match(source, /if \(!controlled\) {\s*dialogEl\.showModal\(\);\s*return;\s*}/s);
	assert.match(source, /if \(open && !dialogEl\.open\) dialogEl\.showModal\(\);/);
	assert.match(source, /else if \(!open && dialogEl\.open\) dialogEl\.close\(\);/);
	assert.match(source, /function requestClose\(\) {\s*if \(busy\) return;\s*if \(controlled\) open = false;\s*onclose\?\.\(\);/s);
	assert.match(source, /onclose={\(\) => {\s*if \(controlled\) open = false;/s);
});

test('Modal busy makes the body inert, shows a spinner and blocks every close path', () => {
	assert.match(source, /busy\?: boolean;/);
	assert.match(source, /aria-busy={busy \|\| undefined}/);
	assert.match(source, /<div class="sheet-body" inert={busy}>/);
	assert.match(source, /{#if busy}<Spinner label="Working" \/>{\/if}/);
	assert.match(source, /<IconButton icon="x" label="Close dialog" disabled={busy} onclick={requestClose} \/>/);
	assert.match(source, /oncancel={\(e\) => {\s*e\.preventDefault\(\);[^}]*requestClose\(\);/s);
	assert.match(source, /if \(e\.target === dialogEl\) requestClose\(\);/);
});

test('Modal tone paints a title glyph and a 3px top border; footer is right-aligned', () => {
	assert.match(source, /tone\?: Tone;/);
	assert.match(source, /type Tone = 'neutral' \| 'danger' \| 'warn' \| 'info';/);
	assert.match(source, /class:sheet-toned={tone !== 'neutral'}/);
	assert.match(source, /style:--modal-tone={tone === 'neutral' \? undefined : `var\(--\${tone}\)`}/);
	assert.match(source, /<Icon name=\{TONE_ICON\[tone\]\} size=\{18\} \/>/);
	assert.match(source, /\.sheet-toned\s*{\s*border-top: 3px solid var\(--modal-tone\);/s);
	assert.match(source, /\.sheet-foot\s*{[^}]*justify-content: flex-end;[^}]*gap: var\(--sp-2\);/s);
});
