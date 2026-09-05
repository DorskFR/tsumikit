import assert from 'node:assert/strict';
import test from 'node:test';
import { hasDecl, normalize, rule } from './helpers.mjs';

const css = `
	.a {
		color: red;
		flex: 1 1 0;
	}
	.a.b { color: blue }
	.c {
		font-size:   var(--fs-sm);
	}
`;

test('rule() parses declarations regardless of order and whitespace', () => {
	assert.deepEqual(rule(css, '.a'), { color: 'red', flex: '1 1 0' });
	assert.deepEqual(rule(css, '.c'), { 'font-size': 'var(--fs-sm)' });
	assert.deepEqual(rule(css, '.zzz'), {});
});

test('hasDecl() matches by value, regexp or presence', () => {
	assert.ok(hasDecl(css, '.a', 'flex', '1 1 0'));
	assert.ok(hasDecl(css, '.a', 'color', /^r/));
	assert.ok(hasDecl(css, '.a', 'color'));
	assert.ok(!hasDecl(css, '.a', 'display'));
	assert.ok(!hasDecl(css, '.a', 'color', 'blue'));
});

test('normalize() collapses whitespace', () => {
	assert.equal(normalize('a\n\t b'), 'a b');
});
