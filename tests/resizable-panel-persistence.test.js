import assert from 'node:assert/strict';
import test from 'node:test';
import {
	parseStoredCollapsed,
	parseStoredWidth,
} from '../src/lib/components/layouts/resizable-panel-persistence.js';

test('missing, blank, and invalid widths preserve the configured default', () => {
	assert.equal(parseStoredWidth(null, 180, 480), undefined);
	assert.equal(parseStoredWidth('', 180, 480), undefined);
	assert.equal(parseStoredWidth('   ', 180, 480), undefined);
	assert.equal(parseStoredWidth('invalid', 180, 480), undefined);
	assert.equal(parseStoredWidth('Infinity', 180, 480), undefined);
});

test('finite persisted widths restore and clamp to the configured bounds', () => {
	assert.equal(parseStoredWidth('320', 180, 480), 320);
	assert.equal(parseStoredWidth('240.5', 180, 480), 240.5);
	assert.equal(parseStoredWidth('0', 180, 480), 180);
	assert.equal(parseStoredWidth('-20', 180, 480), 180);
	assert.equal(parseStoredWidth('600', 180, 480), 480);
});

test('collapsed state only restores from explicit persisted booleans', () => {
	assert.equal(parseStoredCollapsed(null), undefined);
	assert.equal(parseStoredCollapsed(''), undefined);
	assert.equal(parseStoredCollapsed('invalid'), undefined);
	assert.equal(parseStoredCollapsed('true'), true);
	assert.equal(parseStoredCollapsed('false'), false);
});
