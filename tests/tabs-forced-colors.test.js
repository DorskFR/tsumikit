import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { rule } from './helpers.mjs';

const tabs = await readFile(new URL('../src/lib/components/molecules/Tabs.svelte', import.meta.url), 'utf8');
const forced = tabs.match(/@media \(forced-colors: active\) \{([\s\S]*?\n\t\})/)?.[1] ?? '';

test('in forced colours the selected tab is marked by a Highlight border, not the painted indicator', () => {
	assert.ok(forced, 'Tabs has a forced-colors block');
	assert.equal(rule(forced, '.indicator').display, 'none');
	assert.equal(rule(forced, '.tab.selected')['border-bottom'], '2px solid Highlight !important');
});

test('the forced-colours block comes after every variant so it overrides their border resets', () => {
	const at = tabs.indexOf('@media (forced-colors: active)');
	assert.ok(at > tabs.lastIndexOf("[data-fx-tabs='ink']"));
	assert.ok(at > tabs.lastIndexOf('border-bottom: 0;'));
});
