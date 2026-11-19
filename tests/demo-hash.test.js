import assert from 'node:assert/strict';
import test from 'node:test';
import { pageFor, resolveHash, sectionOf } from '../src/demo/framework/hash.ts';

/** @type {Record<string, string>} */
const routes = { toaster: '/molecules/toaster', 'rich-select': '/molecules/rich-select', input: '/atoms/input' };
const pathOf = (/** @type {string} */ id) => routes[id];

test('a section hash of the single-page showcase lands on that component page', () => {
	assert.equal(pageFor('#rich-select', pathOf), '/molecules/rich-select');
});

test('an example anchor keeps its hash on the component page', () => {
	assert.equal(pageFor('#rich-select--states', pathOf), '/molecules/rich-select#rich-select--states');
});

test('former anchors resolve to the section that now covers them', () => {
	assert.equal(pageFor('#toasts', pathOf), '/molecules/toaster');
	assert.equal(pageFor('#form-atoms', pathOf), '/atoms/input');
	assert.equal(resolveHash('#g-forms'), 'input');
});

test('unknown or empty hashes stay on the index', () => {
	assert.equal(pageFor('#nowhere', pathOf), undefined);
	assert.equal(pageFor('#', pathOf), undefined);
	assert.equal(pageFor('', pathOf), undefined);
});

test('sectionOf maps example anchors and former anchors to their section', () => {
	assert.equal(sectionOf('#rich-select--states'), 'rich-select');
	assert.equal(sectionOf('#toasts'), 'toaster');
	assert.equal(sectionOf('button'), 'button');
	assert.equal(sectionOf(''), '');
});
