import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { rule } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/components/molecules/${p}`, import.meta.url), 'utf8');
const [timestamp, popover] = await Promise.all([read('Timestamp.svelte'), read('Popover.svelte')]);

// Regression guard for TSU-101 (0.40.0): the Timestamp details trigger is a
// dotted-underlined <time>, never a padded button.
test('Timestamp details trigger is a bare Popover with an underlined inline <time>', () => {
	assert.match(timestamp, /<Popover label="Timestamp details" placement="bottom-start" bare>/);
	const t = rule(timestamp, '.ts-trigger');
	assert.equal(t['text-decoration-line'], 'underline');
	assert.equal(t['text-decoration-style'], 'dotted');
	for (const prop of ['min-height', 'height', 'padding', 'border']) assert.equal(t[prop], undefined, `${prop} must not be set`);
});

test('no Popover rule can size a bare trigger: box sizing lives on :not(.bare) only', () => {
	const base = rule(popover, '.pop-trigger');
	for (const prop of ['min-height', 'min-width', 'height', 'padding', 'border']) assert.equal(base[prop], undefined, `.pop-trigger sets ${prop}`);
	const sized = rule(popover, '.pop-trigger:not(.bare)');
	assert.equal(sized['min-height'], 'var(--box-md)');
	const bare = rule(popover, ':where(.pop-trigger.bare)');
	assert.equal(bare.display, 'inline');
	assert.equal(bare.padding, '0');
	assert.equal(bare['min-height'], '0');
});
