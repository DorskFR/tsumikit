import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { filters } from '../src/lib/query/ast.ts';
import { parse } from '../src/lib/query/parser.ts';
import { singleQuery, suggestSingle } from '../src/lib/query/single.ts';

/**
 * @param {(q: string, c?: import('../src/lib/query/schema.ts').ValueContext) => import('../src/lib/query/schema.ts').ValueOption[]} [provider]
 * @returns {import('../src/lib/query/schema.ts').Schema}
 */
function cwdSchema(provider) {
	return {
		fields: [
			{
				name: 'cwd',
				label: 'Working directory',
				type: 'string',
				aliases: ['dir'],
				provider:
					provider ??
					((q) =>
						[
							{ value: '/home/dorsk/Documents/tsumikit', label: 'tsumikit' },
							{ value: '/srv/my app', label: 'my app' }
						].filter((o) => o.value.includes(q)))
			}
		]
	};
}

test('singleQuery synthesises the clause the bare value stands for', () => {
	const schema = cwdSchema();
	assert.equal(singleQuery(schema, 'cwd', '/srv/app'), 'cwd:/srv/app');
	assert.equal(singleQuery(schema, 'cwd', '/srv/my app'), 'cwd:"/srv/my app"');
	assert.equal(singleQuery(schema, 'dir', '/srv/app'), 'cwd:/srv/app');
});

test('an empty value or an unknown key synthesises no clause', () => {
	const schema = cwdSchema();
	assert.equal(singleQuery(schema, 'cwd', ''), '');
	assert.equal(singleQuery(schema, 'nope', '/srv/app'), '');
	assert.equal(parse(singleQuery(schema, 'cwd', ''), schema).root, null);
});

test('the synthesised query parses back to one filter on the key', () => {
	const schema = cwdSchema();
	const [clause, ...rest] = filters(parse(singleQuery(schema, 'cwd', '/srv/my app'), schema));
	assert.equal(rest.length, 0);
	assert.equal(clause.field, 'cwd');
	assert.equal(clause.op, 'contains');
	assert.deepEqual(clause.values, ['/srv/my app']);
});

test('suggestSingle completes the whole box through the field provider', async () => {
	const state = await suggestSingle(cwdSchema(), 'cwd', '/srv');
	assert.ok(state);
	assert.equal(state.kind, 'value');
	assert.deepEqual(state.span, [0, '/srv'.length]);
	assert.deepEqual(
		state.items.map((i) => i.insert),
		['/srv/my app']
	);
	assert.equal(state.items[0].label, 'my app');
	assert.equal(state.items[0].caret, '/srv/my app'.length);
	assert.equal(state.items[0].advance, undefined);
});

test('accepting an item replaces the value outright — no key prefix, no quotes', async () => {
	const value = '/srv';
	const state = await suggestSingle(cwdSchema(), 'cwd', value);
	assert.ok(state);
	const [a, b] = state.span;
	assert.equal(value.slice(0, a) + state.items[0].insert + value.slice(b), '/srv/my app');
});

test('the provider sees the bare fragment and a span covering the box', async () => {
	/** @type {{ query?: string, context?: import('../src/lib/query/schema.ts').ValueContext }} */
	const sink = {};
	await suggestSingle(
		cwdSchema((query, context) => {
			sink.query = query;
			sink.context = context;
			return [{ value: query, label: query }];
		}),
		'cwd',
		'/srv/ap'
	);
	assert.equal(sink.query, '/srv/ap');
	assert.ok(sink.context);
	assert.equal(sink.context.rawQuery, '/srv/ap');
	assert.deepEqual(sink.context.span, [0, 7]);
	assert.equal(sink.context.caret, 7);
});

test('no options and an unknown key both mean no dropdown', async () => {
	assert.equal(await suggestSingle(cwdSchema(() => []), 'cwd', 'x'), null);
	assert.equal(await suggestSingle(cwdSchema(), 'nope', ''), null);
});

const component = await readFile(
	new URL('../src/lib/components/molecules/FilterInput.svelte', import.meta.url),
	'utf8'
);

test('FilterInput takes a key prop that switches the bar to single-key mode', () => {
	assert.match(component, /key\?: string;/);
	assert.match(component, /const single = \$derived\(!!key\);/);
	assert.match(component, /parse\(key \? singleQuery\(schema, key, value\) : value, schema\)/);
	assert.match(
		component,
		/key \? await suggestSingle\(schema, key, value\) : await suggest\(schema, value, pos\)/
	);
});

test('single-key mode quotes nothing and shows the placeholder', () => {
	assert.match(component, /const quoting = \$derived\(autoQuote && !single\);/);
	assert.doesNotMatch(component, /if \(autoQuote &&/);
	assert.match(component, /placeholder \?\? \(single \? '' : 'artist:"Daft Punk" AND year>=2000'\)/);
	assert.match(component, /placeholder=\{hint\}/);
});

test('removing the single-key clause empties the box instead of splicing spans', () => {
	assert.match(component, /if \(single\) \{\s*value = '';\s*onsubmit\?\.\(''\);/);
});
