import assert from 'node:assert/strict';
import test from 'node:test';
import { closingQuoteExit, insideQuoteAtCaret } from '../src/lib/query/edit.ts';
import { parse } from '../src/lib/query/parser.ts';
import { compilePredicate, serialize, toSql } from '../src/lib/query/query.ts';
import { singleQuery } from '../src/lib/query/single.ts';
import { activeToken, suggest } from '../src/lib/query/suggest.ts';

/** @type {import('../src/lib/query/schema.ts').Schema} */
const schema = {
	fields: [
		{ name: 'title', label: 'Title', type: 'string' },
		{ name: 'cwd', label: 'Cwd', type: 'string' },
		{ name: 'year', label: 'Year', type: 'number' },
		{ name: 'released', label: 'Released', type: 'date' },
		{ name: 'status', label: 'Status', type: 'enum', options: [{ value: 'a b', label: 'a b' }] },
		{
			name: 'artist',
			label: 'Artist',
			type: 'string',
			options: [{ value: 'say "hi"', label: 'say "hi"' }],
		},
	],
};

/** @param {string} s */
const root = (s) => parse(s, schema).root;
/** @param {string} s */
const roundTrip = (s) => serialize(parse(serialize(parse(s, schema)), schema));

/** @param {import('../src/lib/query/ast.ts').ExprNode | null} node */
function strip(node) {
	return JSON.parse(JSON.stringify(node, (k, v) => (k === 'span' ? undefined : v)));
}

test('`..` stays inside an unquoted string value', () => {
	assert.deepEqual(strip(root('cwd:../foo')), {
		kind: 'filter',
		field: 'cwd',
		op: 'contains',
		values: ['../foo'],
	});
	assert.deepEqual(strip(root('title:a..b')), {
		kind: 'filter',
		field: 'title',
		op: 'contains',
		values: ['a..b'],
	});
});

test('`..` still splits a range on number and date fields', () => {
	assert.deepEqual(strip(root('year:2000..2010')), {
		kind: 'filter',
		field: 'year',
		op: 'range',
		values: ['2000', '2010'],
	});
	assert.deepEqual(strip(root('released:2021-01-01..2021-12-31')), {
		kind: 'filter',
		field: 'released',
		op: 'range',
		values: ['2021-01-01', '2021-12-31'],
	});
	assert.equal(roundTrip('year:2000..2010'), 'year:2000..2010');
});

test('a programmatic value containing `..` serialises quoted and re-parses intact', () => {
	const s = serialize({
		root: { kind: 'filter', field: 'cwd', op: 'contains', values: ['../x'], span: [0, 0] },
	});
	assert.equal(s, 'cwd:"../x"');
	assert.deepEqual(root(s)?.kind === 'filter' && /** @type {any} */ (root(s))?.values, ['../x']);
	assert.equal(singleQuery(schema, 'cwd', '../x'), 'cwd:"../x"');
});

test('values containing `"` are escaped by serialize and re-parse to the same value', () => {
	for (const v of ['say "hi" now', 'C:\\my dir', 'C:\\my dir\\', 'a\\"b', 'x\\\\y "z"', '"', "it's a 'q'"]) {
		const q = { root: { kind: 'filter', field: 'title', op: 'contains', values: [v], span: [0, 0] } };
		const s = serialize(/** @type {any} */ (q));
		const back = root(s);
		assert.equal(back?.kind, 'filter', s);
		assert.deepEqual(back.kind === 'filter' && back.values, [v], s);
	}
	assert.equal(root('title:"say \\"hi\\" now"')?.kind === 'filter' && /** @type {any} */ (root('title:"say \\"hi\\" now"'))?.values[0], 'say "hi" now');
	assert.equal(root('cwd:"C:\\foo"')?.kind === 'filter' && /** @type {any} */ (root('cwd:"C:\\foo"'))?.values[0], 'C:\\foo');
});

test('a suggested value containing `"` inserts an escaped clause', async () => {
	const state = await suggest(schema, 'artist:', 7);
	assert.ok(state);
	assert.equal(state.items[0].insert, 'artist:"say \\"hi\\""');
	const back = root(state.items[0].insert);
	assert.equal(back?.kind === 'filter' && back.values[0], 'say "hi"');
	const spaced = await suggest(schema, 'status=', 7);
	assert.equal(spaced?.items[0].insert, 'status="a b"');
});

test('a stray `)` is ignored and the rest of the query is kept', () => {
	assert.deepEqual(strip(root('a ) b')), { kind: 'text', value: 'a b' });
	assert.deepEqual(strip(root('title:x ) year>2000')), {
		kind: 'and',
		children: [
			{ kind: 'filter', field: 'title', op: 'contains', values: ['x'] },
			{ kind: 'filter', field: 'year', op: 'gt', values: ['2000'] },
		],
	});
	assert.deepEqual(strip(root(') a')), { kind: 'text', value: 'a' });
	assert.deepEqual(strip(root('(a OR b)) c')), {
		kind: 'and',
		children: [
			{ kind: 'or', children: [{ kind: 'text', value: 'a' }, { kind: 'text', value: 'b' }] },
			{ kind: 'text', value: 'c' },
		],
	});
	assert.equal(serialize(parse('a ) b', schema)), 'a b');
});

test('an apostrophe inside a word does not open a quote', async () => {
	const s = "don't artist:";
	assert.equal(insideQuoteAtCaret(s, s.length), false);
	assert.deepEqual(activeToken(s, s.length), { start: 6, end: 13, raw: 'artist:' });
	const state = await suggest(schema, s, s.length);
	assert.equal(state?.kind, 'value');
	assert.deepEqual(state?.span, [6, 13]);
	assert.deepEqual(strip(root(s)), {
		kind: 'and',
		children: [
			{ kind: 'text', value: "don't" },
			{ kind: 'filter', field: 'artist', op: 'contains', values: [''] },
		],
	});
});

test('quotes still open after an operator and at a token start', () => {
	const v = "title:'star wars";
	assert.equal(insideQuoteAtCaret(v, v.length), true);
	assert.equal(closingQuoteExit("title:'star wars' x", 10), 17);
	const d = 'title:"ok computer';
	assert.deepEqual(activeToken(d, d.length), { start: 0, end: d.length, raw: d });
	assert.equal(insideQuoteAtCaret('"daft punk', 10), true);
	assert.equal(insideQuoteAtCaret("'tis the season", 15), false);
	assert.equal(insideQuoteAtCaret('title:"say \\"hi', 15), true);
});

test('a quoted free-text phrase drops its quotes and matches', () => {
	assert.deepEqual(strip(root('"daft punk"')), { kind: 'text', value: 'daft punk' });
	assert.equal(compilePredicate(parse('"daft punk"', schema))({ title: 'Daft Punk' }), true);
	assert.equal(serialize(parse('"daft punk"', schema)), 'daft punk');
	assert.deepEqual(strip(root('"say \\"hi\\""')), { kind: 'text', value: 'say "hi"' });
	assert.equal(serialize(parse('"say \\"hi\\""', schema)), '"say \\"hi\\""');
	assert.deepEqual(strip(root("'tis cool")), { kind: 'text', value: "'tis cool" });
	assert.equal(toSql(parse('"daft punk"', schema)).includes("plainto_tsquery('daft punk')"), true);
});

test('toSql escapes LIKE patterns and quotes', () => {
	assert.equal(
		toSql(parse("artist:o'brien", schema)),
		"SELECT * FROM tracks\nWHERE artist ILIKE '%o''brien%' ESCAPE '\\';",
	);
	assert.equal(
		toSql(parse('title!:"100%_a\\b"', schema)),
		"SELECT * FROM tracks\nWHERE title NOT ILIKE '%100\\%\\_a\\\\b%' ESCAPE '\\';",
	);
});

test('plain queries keep their canonical form', () => {
	for (const s of [
		'artist:"Daft Punk" year>=2021',
		'title:x OR NOT year<2000 status=a',
		'(title:x OR year<2000) status=a',
		'status in (a, b) released<2020',
		'foo bar',
		"don't stop",
		'cwd:/srv/app',
	]) {
		assert.equal(serialize(parse(s, schema)), s);
	}
});
