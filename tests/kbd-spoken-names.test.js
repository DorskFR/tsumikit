import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const kbd = await readFile(new URL('../src/lib/components/atoms/Kbd.svelte', import.meta.url), 'utf8');

test('Kbd glyphs carry a spoken name; the glyph itself is hidden from AT', () => {
	assert.match(kbd, /function label\(token: string\): Key/);
	for (const [glyph, name] of [
		['⌘', 'Command'],
		['⇧', 'Shift'],
		['↵', 'Enter'],
		['⌥', 'Option'],
		['↑', 'Up arrow'],
		['↓', 'Down arrow'],
		['←', 'Left arrow'],
		['→', 'Right arrow']
	])
		assert.match(kbd, new RegExp(`key\\('${glyph}', '${name}'\\)`), name);
	assert.match(kbd, /<span aria-hidden="true">\{token\.glyph\}<\/span\s*><span class="kbd-name">\{token\.name\}<\/span>/);
	assert.match(kbd, /\{#if token\.name === token\.glyph\}\{token\.glyph\}/);
	assert.match(kbd, /\.kbd-name \{[^}]*position: absolute;[^}]*clip: rect\(0, 0, 0, 0\);/s);
	assert.match(kbd, /<span class="kbd-sep" aria-hidden="true">\+<\/span>/);
});
