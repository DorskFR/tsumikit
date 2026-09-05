import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { rowsFloor } from '../src/lib/autoresize.ts';

const [textarea, action] = await Promise.all([
	readFile(new URL('../src/lib/components/atoms/Textarea.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/autoresize.ts', import.meta.url), 'utf8')
]);

test('autoresize keeps rows as a height floor', () => {
	assert.match(action, /Math\.max\(parseFloat\(node\.style\.minHeight\) \|\| 0, rowsFloor\(node\)\)/);
	// @ts-expect-error minimal stub
	globalThis.getComputedStyle = () => ({
		fontSize: '16px',
		lineHeight: '20px',
		paddingTop: '8px',
		paddingBottom: '8px',
		borderTopWidth: '1px',
		borderBottomWidth: '1px'
	});
	/** @param {number} rows */
	const ta = (rows) => /** @type {HTMLTextAreaElement} */ (/** @type {unknown} */ ({ rows }));
	assert.equal(rowsFloor(ta(3)), 78);
	assert.equal(rowsFloor(ta(1)), 0);
});

test('autoresize no longer suppresses the bottom grip', () => {
	assert.match(textarea, /const handleEdge = \$derived\(resize\);/);
	assert.doesNotMatch(textarea, /resize === 'top' \? 'top' : 'none'/);
});
