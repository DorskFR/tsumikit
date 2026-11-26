import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { rule } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/components/molecules/${p}`, import.meta.url), 'utf8');
const [timestamp, popover] = await Promise.all([read('Timestamp.svelte'), read('Popover.svelte')]);

test('Timestamp details trigger is a bare Popover with a dotted-underlined inline <time> at rest', () => {
	assert.match(timestamp, /<Popover label="{label}, details" placement="bottom-start" bare>/);
	const t = rule(timestamp, '.ts-trigger');
	assert.equal(t['text-decoration-line'], 'underline', 'underlined at rest');
	assert.equal(t['text-decoration-style'], 'dotted');
	assert.equal(t['text-underline-offset'], '2px');
	assert.equal(t['text-decoration-color'], 'var(--border-strong)');
	for (const sel of ['.ts-trigger:focus-visible', '.ts-trigger:hover']) {
		const r = rule(timestamp, sel);
		assert.equal(r['text-decoration-color'], 'currentColor', `${sel} inks the underline`);
		assert.equal(r['text-decoration-line'], undefined, `${sel} must not toggle the underline`);
	}
	for (const prop of ['min-height', 'height', 'padding', 'border']) assert.equal(t[prop], undefined, `${prop} must not be set`);
});

test('no Popover chrome can reach a bare trigger: box, radius, background and hover live on :not(.bare) only', () => {
	assert.doesNotMatch(popover, /\n\t\.pop-trigger\s*{/, 'a bare `.pop-trigger` rule would leak chrome onto bare triggers');
	assert.doesNotMatch(popover, /\n\t\.pop-trigger:hover/, 'hover chrome must be scoped to :not(.bare)');
	assert.doesNotMatch(popover, /\n\t\.pop-trigger:not\(\.bare\)/, 'default chrome must be zero-specificity so triggerClass wins');
	const sized = rule(popover, ':where(.pop-trigger:not(.bare))');
	assert.equal(sized['min-height'], 'var(--box-sm)');
	assert.equal(sized['border-radius'], 'var(--r-md)');
	assert.equal(rule(popover, ':where(.pop-trigger:not(.bare):hover:not(:disabled))').background, 'var(--bg-elevated-2)');
	const bare = rule(popover, ':where(.pop-trigger.bare)');
	assert.equal(bare.display, 'inline');
	assert.equal(bare.padding, '0');
	assert.equal(bare['border-radius'], '0');
	assert.equal(bare.background, 'none');
});
