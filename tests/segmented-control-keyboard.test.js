import assert from 'node:assert/strict';
import test from 'node:test';
import { nextEnabledSegment } from '../src/lib/components/molecules/segmented-control-keyboard.js';

const options = [{}, { disabled: true }, {}, {}];

test('arrow navigation wraps and skips disabled segments', () => {
	assert.equal(nextEnabledSegment(options, 0, 'ArrowRight'), 2);
	assert.equal(nextEnabledSegment(options, 2, 'ArrowLeft'), 0);
	assert.equal(nextEnabledSegment(options, 3, 'ArrowRight'), 0);
	assert.equal(nextEnabledSegment(options, 0, 'ArrowLeft'), 3);
	assert.equal(nextEnabledSegment(options, 0, 'ArrowDown'), 2);
	assert.equal(nextEnabledSegment(options, 2, 'ArrowUp'), 0);
});

test('Home and End select the first and last enabled segments', () => {
	assert.equal(nextEnabledSegment(options, 2, 'Home'), 0);
	assert.equal(nextEnabledSegment(options, 0, 'End'), 3);
});

test('unhandled keys and invalid current values preserve native behavior', () => {
	assert.equal(nextEnabledSegment(options, 0, 'Enter'), undefined);
	assert.equal(nextEnabledSegment(options, -1, 'ArrowRight'), undefined);
});

test('navigation remains stable when every segment is disabled', () => {
	const disabled = [{ disabled: true }, { disabled: true }];
	assert.equal(nextEnabledSegment(disabled, 1, 'ArrowRight'), 1);
	assert.equal(nextEnabledSegment(disabled, 1, 'Home'), 1);
	assert.equal(nextEnabledSegment(disabled, 1, 'End'), 1);
});
