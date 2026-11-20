import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { hasDecl, normalize } from './helpers.mjs';

const LIB = new URL('../src/lib/', import.meta.url);

/** @param {string} p */
const read = (p) => readFile(new URL(p, LIB), 'utf8');

/** @returns {Promise<string[]>} */
async function styleFiles() {
	const names = await readdir(LIB, { recursive: true });
	return names.filter((n) => /\.(css|svelte)$/.test(n));
}

const button = await read('components/atoms/Button.svelte');
const fileButton = await read('components/molecules/FileButton.svelte');
const depth = await read('looks/depth.css');

test('a focused ghost Button shows the focus glow on its own', () => {
	assert.ok(hasDecl(button, '.btn-ghost', 'box-shadow', 'none'));
	assert.ok(hasDecl(button, ".btn-ghost:focus-visible:not(.btn-link, .btn-icon-inline, [aria-pressed='true'])", 'box-shadow', 'var(--focus-glow)'));
});

test('the depth look keeps the ghost glow while hovered', () => {
	assert.ok(
		hasDecl(
			depth,
			':root[data-look="depth"] .btn.btn-ghost:hover:focus-visible:not(:disabled, .btn-link, .btn-icon-inline, [aria-pressed="true"])',
			'box-shadow',
			'var(--focus-glow)'
		)
	);
});

test('a focused ghost FileButton shows the focus glow on its own', () => {
	assert.ok(hasDecl(fileButton, '.file-btn.ghost:focus-within', 'box-shadow', 'var(--focus-glow)'));
	assert.ok(hasDecl(fileButton, '.file-btn.ghost:hover:focus-within:not(.disabled)', 'box-shadow', 'var(--focus-glow)'));
});

test('no shadow list contains none, in a declaration or in a token a list reads', async () => {
	const files = await styleFiles();
	const sources = await Promise.all(files.map(async (f) => /** @type {const} */ ([f, normalize(await read(f))])));
	/** @type {Set<string>} */
	const listed = new Set();
	for (const [file, src] of sources) {
		for (const [, value] of src.matchAll(/[\s;{](?:box|text)-shadow\s*:\s*([^;}]+)/g)) {
			const parts = value.split(/,(?![^(]*\))/).map((p) => p.trim());
			if (parts.length < 2) continue;
			assert.ok(!parts.some((p) => /^none\b/.test(p)), `${file}: shadow list "${value.trim()}" contains none`);
			for (const part of parts) for (const [, name] of part.matchAll(/^var\((--[a-z0-9-]+)\)/g)) listed.add(name);
		}
	}
	assert.ok(listed.has('--focus-glow'));
	for (const [file, src] of sources) {
		for (const [, name, value] of src.matchAll(/[\s;{](--[a-z0-9-]+)\s*:\s*([^;}]+)/g)) {
			if (listed.has(name)) assert.notEqual(value.trim(), 'none', `${file}: ${name} is none but is read inside a shadow list`);
		}
	}
});
