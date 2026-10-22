import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} p */
const read = (p) => readFile(new URL(`../src/lib/components/${p}`, import.meta.url), 'utf8');
/** @param {string} src */
const css = (src) => src.slice(src.indexOf('<style>'));
/** @param {string} sheet @param {string} selector */
const rule = (sheet, selector) => {
	const m = sheet.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
	assert.ok(m, `missing rule ${selector}`);
	return m[1];
};

test('Divider label wraps and centres instead of spilling past the rule', async () => {
	const label = rule(css(await read('atoms/Divider.svelte')), '.divider-label');
	assert.doesNotMatch(label, /white-space:\s*nowrap/);
	assert.match(label, /text-align:\s*center/);
	assert.match(label, /min-width:\s*0/);
});

test('RadioGroup rows never force a flex or grid parent wider than their truncated descriptions', async () => {
	const sheet = css(await read('molecules/RadioGroup.svelte'));
	assert.match(rule(sheet, '.rows'), /min-width:\s*0/);
	assert.match(rule(sheet, '.row .description'), /text-overflow:\s*ellipsis/);
});

test('RadioGroup label line wraps the note under a long label instead of squeezing the label', async () => {
	const sheet = css(await read('molecules/RadioGroup.svelte'));
	assert.match(rule(sheet, '.label-line'), /flex-wrap:\s*wrap/);
	assert.doesNotMatch(rule(sheet, '.note'), /white-space:\s*nowrap/);
});

test('Toggle grow truncates its label with an ellipsis and keeps the plain layout otherwise', async () => {
	const src = await read('molecules/Toggle.svelte');
	assert.match(src, /<span class="label">\{@render children\?\.\(\)\}<\/span>/);
	const sheet = css(src);
	assert.match(rule(sheet, '.label'), /display:\s*contents/);
	const grow = rule(sheet, '.toggle.grow .label');
	assert.match(grow, /display:\s*block/);
	assert.match(grow, /overflow:\s*hidden/);
	assert.match(grow, /text-overflow:\s*ellipsis/);
	assert.match(grow, /min-width:\s*0/);
	assert.match(rule(sheet, '.toggle.grow'), /flex:\s*1 1 0/);
});

test('FileButton never exceeds its container and truncates a long label', async () => {
	const src = await read('molecules/FileButton.svelte');
	assert.match(src, /<span class="text" class:sr-only=\{onlyIcon\}>\{label\}<\/span>/);
	const sheet = css(src);
	assert.match(rule(sheet, '.file-btn'), /max-width:\s*100%/);
	const text = rule(sheet, '.text:not(.sr-only)');
	assert.match(text, /overflow:\s*hidden/);
	assert.match(text, /text-overflow:\s*ellipsis/);
	assert.match(text, /min-width:\s*0/);
});

test('CopyButton with box and showLabel widens for the label instead of overflowing the square', async () => {
	const src = await read('molecules/CopyButton.svelte');
	assert.match(src, /class="copy-btn \{labelShown && box !== undefined \? 'copy-labelled' : ''\} \{klass\}"/);
	const labelled = rule(css(src), ':global(.copy-btn.btn-box.copy-labelled)');
	assert.match(labelled, /width:\s*auto/);
	assert.match(labelled, /padding-inline:\s*var\(--sp-2\)/);
});

test('Field never forces a grid or flex parent wider than its label plus the control intrinsic width', async () => {
	const sheet = css(await read('molecules/Field.svelte'));
	assert.match(rule(sheet, '.field'), /min-width:\s*0/);
	assert.match(rule(sheet, '.field-grow'), /flex:\s*1 1 0/);
});

test('Select width="auto" caps at its container and truncates the shown option', async () => {
	const sheet = css(await read('atoms/Select.svelte'));
	assert.match(rule(sheet, '.select-wrap.w-auto'), /max-width:\s*100%/);
	const select = rule(sheet, '.select.w-auto');
	assert.match(select, /max-width:\s*100%/);
	assert.match(select, /text-overflow:\s*ellipsis/);
});
