import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { compile, preprocess } from 'svelte/compiler';
import { normalize } from './helpers.mjs';

const source = await readFile(
	new URL('../src/lib/components/molecules/Popover.svelte', import.meta.url),
	'utf8'
);
const { code } = await preprocess(source, vitePreprocess(), { filename: 'Popover.svelte' });
// Client, not server: SSR output drops event handlers, so only this build shows their order.
const compiled = compile(code, { generate: 'client', filename: 'Popover.svelte' }).js.code;

test('Popover takes rest props on the house Omit<HTMLAttributes, keyof Own> pattern', () => {
	assert.match(normalize(source), /\.\.\.rest \}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = \$props\(\);/);
	assert.match(source, /import type \{ HTMLAttributes \} from 'svelte\/elements';/);
});

test('rest lands on the trigger, which is the element a consumer anchors to', () => {
	assert.match(normalize(source), /bind:this=\{triggerEl\} \{\.\.\.rest\} data-tsu="Popover"/);
});

test("the trigger's own wiring is applied after the spread and cannot be overridden", () => {
	const after = compiled.slice(compiled.indexOf('...rest'));
	for (const key of ['data-tsu', 'aria-label', 'aria-haspopup', 'aria-expanded', 'class']) {
		assert.match(after, new RegExp(`["']?${key}["']?:`), `${key} is not applied after the spread`);
	}
	assert.match(after, /triggerAttrs/, 'popovertarget/type wiring is not applied after the spread');
	for (const handler of ['onclick', 'onkeydown', 'onpointerenter', 'onpointerleave']) {
		assert.match(after, new RegExp(handler), `${handler} is not applied after the spread`);
	}
});

test('the panel keeps its own attributes: rest is trigger-only', () => {
	const panel = normalize(source).match(/<div bind:this=\{panelEl\}[^>]*>/)?.[0] ?? '';
	assert.ok(panel, 'panel element not found');
	assert.doesNotMatch(panel, /\.\.\.rest/);
	assert.match(panel, /popover="auto"/);
});

test('a Popover passed nothing extra is unchanged', () => {
	assert.match(normalize(source), /class="pop-trigger \{triggerClass\} \{klass\}"/);
	assert.match(normalize(source), /aria-expanded=\{open\}/);
	assert.match(normalize(source), /role = 'dialog',/);
	assert.match(normalize(source), /haspopup = 'dialog',/);
});
