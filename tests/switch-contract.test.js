import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/lib/components/atoms/Switch.svelte', import.meta.url), 'utf8');

test('Switch: bindable checked, toggles on click, still forwards onclick', () => {
	assert.match(source, /checked = \$bindable\(false\)/);
	assert.match(source, /onclick\?\.\(e\);\s*if \(e\.defaultPrevented\) return;\s*checked = !checked;/);
});

test('Switch size=sm shrinks the track and knob', () => {
	assert.match(source, /size\?: ControlSize/);
	assert.match(source, /class:switch-sm={size === 'sm'}/);
	assert.match(source, /\.switch-sm\s*{\s*width: 2rem;/);
});

test('Switch labelVisible renders the label as text and drops the duplicate aria-label', () => {
	assert.match(source, /labelVisible\?: boolean/);
	assert.match(source, /aria-label={labelVisible \? undefined : label}/);
	assert.match(source, /<label class="switch-row"[^>]*>\s*{@render control\(\)}\s*<span class="switch-label">{label}<\/span>/);
});
