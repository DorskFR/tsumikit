import assert from 'node:assert/strict';
import test from 'node:test';
import { suggest } from '../src/lib/query/suggest.ts';

/**
 * @typedef {import('../src/lib/query/schema.ts').ValueContext} ValueContext
 * @typedef {{ query?: string, context?: ValueContext }} Sink
 */

/**
 * @param {Sink} sink
 * @returns {import('../src/lib/query/schema.ts').Schema}
 */
function schemaCapturing(sink) {
	return {
		fields: [
			{
				name: 'album',
				label: 'Album',
				type: 'string',
				provider: (query, context) => {
					sink.query = query;
					sink.context = context;
					return [{ value: query || 'ok', label: 'ok' }];
				},
			},
		],
	};
}

test('quoted clause exposes the removable active span', async () => {
	/** @type {Sink} */
	const sink = {};
	const q = 'album:"ok computer';
	await suggest(schemaCapturing(sink), q, q.length);

	assert.equal(sink.query, 'ok computer');
	assert.ok(sink.context);
	assert.deepEqual(sink.context.span, [0, q.length]);
	assert.equal(sink.context.rawQuery, q);
	assert.equal(sink.context.caret, q.length);
	assert.equal(q.slice(sink.context.span[0], sink.context.span[1]), 'album:"ok computer');
});

test('middle-of-query completion exposes the correct active span', async () => {
	/** @type {Sink} */
	const sink = {};
	const q = 'album:ok year:2020';
	const caret = 7; // between "o" and "k" of the first clause's value

	await suggest(schemaCapturing(sink), q, caret);

	assert.equal(sink.query, 'ok');
	assert.ok(sink.context);
	assert.deepEqual(sink.context.span, [0, 8]);
	assert.equal(sink.context.caret, caret);
	assert.equal(q.slice(sink.context.span[0], sink.context.span[1]), 'album:ok');
});
