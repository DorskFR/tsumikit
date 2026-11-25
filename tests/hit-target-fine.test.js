import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { rule } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const tokens = await read('styles/tokens.css');

const targets = /** @type {const} */ ([
	['components/atoms/Button.svelte', '.btn-icon-inline:not(.hit-compact)', '::after'],
	['components/atoms/Button.svelte', '.btn-link:not(.hit-compact)', '::before'],
	['components/molecules/Popover.svelte', '.pop-trigger:not(.canonical, .hit-compact)', '::after'],
	['components/atoms/Badge.svelte', '.action', '::before'],
	['components/atoms/Switch.svelte', '.switch', '::before'],
	['components/molecules/Toggle.svelte', '.toggle', '::before'],
	['components/atoms/Checkbox.svelte', '.checkbox', '::before']
]);

test('--hit-target is 24px on every pointer and follows --touch-target on coarse ones', () => {
	assert.match(tokens, /^\s*--hit-target: 24px;$/m);
	assert.match(tokens, /^\s*--hit-slab: min\(0px, calc\(\(100% - var\(--hit-target\)\) \/ 2\)\);$/m);
	const coarse = tokens.slice(tokens.indexOf('@media (pointer: coarse)'));
	assert.match(coarse.slice(0, coarse.indexOf('\n}')), /--hit-target: var\(--touch-target\);/);
});

for (const [file, host, pseudo] of targets) {
	test(`${host} reaches --hit-target outside the coarse block, before the coarse slab`, async () => {
		const src = await read(file);
		const css = src.slice(src.indexOf('<style>'));
		const base = css.slice(0, css.indexOf(`@media (pointer: coarse) {\n\t\t${host.split(':')[0]}`));
		const esc = host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		assert.match(base, new RegExp(`(?:^|[}\\n,])\\s*${esc}(?:,[^{]*)?\\s*{\\s*position: relative;\\s*}`), host);
		const slab = rule(base, `${host}${pseudo}`);
		assert.equal(slab.content, "''", host);
		assert.equal(slab.position, 'absolute', host);
		assert.equal(slab['inset-block'], 'var(--hit-slab)', host);
		assert.equal(slab['inset-inline-start'], 'var(--hit-slab)', host);
		assert.equal(slab['inset-inline-end'], '0', host);
	});
}
