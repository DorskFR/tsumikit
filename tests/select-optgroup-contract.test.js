import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { sectionOptions } from '../src/lib/select-options.ts';

/** @param {string} p */
const read = (p) => readFile(new URL(`../src/${p}`, import.meta.url), 'utf8');
const [select, index, page] = await Promise.all([
	read('lib/components/atoms/Select.svelte'),
	read('lib/index.ts'),
	read('routes/+page.svelte')
]);

/** @param {ReturnType<typeof sectionOptions>} sections */
const shape = (sections) => sections.map((s) => [s.group, s.options.map((o) => o.value)]);

test('an options array without group yields one ungrouped section, unchanged', () => {
	const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }];
	assert.deepEqual(shape(sectionOptions(options)), [[undefined, ['a', 'b']]]);
});

test('options sharing a group collapse into one section at the group first appearance', () => {
	const options = [
		{ value: 'p1', label: 'p1', group: 'Pools' },
		{ value: 'a1', label: 'a1', group: 'Accounts' },
		{ value: 'p2', label: 'p2', group: 'Pools' },
		{ value: 'a2', label: 'a2', group: 'Accounts' }
	];
	assert.deepEqual(shape(sectionOptions(options)), [
		['Pools', ['p1', 'p2']],
		['Accounts', ['a1', 'a2']]
	]);
});

test('ungrouped entries stay top-level and keep their position relative to the groups', () => {
	const options = [
		{ value: 'auto', label: 'Auto' },
		{ value: 'none', label: 'None' },
		{ value: 'p1', label: 'p1', group: 'Pools' },
		{ value: 'a1', label: 'a1', group: 'Accounts' },
		{ value: 'other', label: 'Other' }
	];
	assert.deepEqual(shape(sectionOptions(options)), [
		[undefined, ['auto', 'none']],
		['Pools', ['p1']],
		['Accounts', ['a1']],
		[undefined, ['other']]
	]);
});

test('nothing is sorted: a later group never jumps ahead of an earlier one', () => {
	const options = [
		{ value: 'z', label: 'z', group: 'Zeta' },
		{ value: 'a', label: 'a', group: 'Alpha' }
	];
	assert.deepEqual(
		sectionOptions(options).map((s) => s.group),
		['Zeta', 'Alpha']
	);
});

test('SelectOption carries an optional group and the helper is exported from the kit', () => {
	assert.match(select, /export type SelectOption = {[\s\S]*group\?: string;\s*};/);
	assert.match(index, /export { type OptionSection, sectionOptions } from '\.\/select-options';/);
});

test('grouped sections render a real <optgroup>; ungrouped ones stay bare <option>s', () => {
	assert.match(select, /const sections = \$derived\(sectionOptions\(options \?\? \[\]\)\);/);
	assert.match(select, /{#if section\.group === undefined}[\s\S]*<option value={o\.value} disabled={o\.disabled}>{optionText\(o\)}<\/option>[\s\S]*{:else}\s*<optgroup label={section\.group}>/);
	assert.match(select, /\.select\.has-face option,\s*\.select\.has-face optgroup\s*{[^}]*color: var\(--text\);/s);
});

test('demo shows a sectioned select', () => {
	assert.match(page, /group: 'Pools'/);
	assert.match(page, /group: 'Accounts'/);
});
