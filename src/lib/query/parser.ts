// ─────────────────────────────────────────────────────────────────────────
// Layer 2 — a tolerant, error-recovering recursive-descent parser.
//
// Hand-written (not a grammar generator) precisely BECAUSE the input is "free
// for all": we must parse partial input (`artist:` with no value, for
// autocomplete) and slightly-wrong input (a malformed clause must degrade to
// free text, never throw). Output is the serialisable expression tree in
// ast.ts.
//
// Grammar (precedence NOT > AND > OR; AND is implicit between adjacent terms):
//   orExpr   := andExpr ( OR andExpr )*
//   andExpr  := notExpr ( (AND)? notExpr )*
//   notExpr  := (NOT)? primary
//   primary  := '(' orExpr ')' | filter | text-word
//
// Leaf textual forms understood:
//   artist:"Daft Punk"          → contains
//   artist!:bootleg             → not_contains
//   year>=2021  released<2020   → numeric/date comparisons
//   status=released  by!=me     → is / is not
//   genre in (house, techno)    → any of
//   year..2021..2024            → range  (field..a..b)  also  field:a..b
//   free floating words         → TextNode (full-text)
//
// Error recovery: unmatched `)` is ignored, a missing `)` closes at end of
// input, a dangling AND/OR/NOT with no operand collapses to its operand, and an
// empty group yields nothing. The parser never throws.
// ─────────────────────────────────────────────────────────────────────────

import type { ExprNode, FilterNode, LeafNode, Query, TextNode } from './ast';
import { findField, operatorByCode, operatorsFor, type Schema } from './schema';

const IDENT = /[A-Za-z_][\w-]*/y;
// Longest operator codes first so `>=` wins over `>`.
const OP_CODES = ['!:', '!=', '>=', '<=', ':', '=', '>', '<'];
const KEYWORDS = new Set(['AND', 'OR', 'NOT']);

interface Scanner {
	s: string;
	i: number;
}

function skipWs(sc: Scanner) {
	while (sc.i < sc.s.length && /\s/.test(sc.s[sc.i])) sc.i++;
}

// Only skip spaces/tabs; used so `artist: foo` (space after colon) still
// attaches `foo` as the value without crossing a real token boundary.
function skipWsInline(sc: Scanner) {
	while (sc.i < sc.s.length && (sc.s[sc.i] === ' ' || sc.s[sc.i] === '\t')) sc.i++;
}

/** Read a value token: a "quoted string", or a bare run up to whitespace. */
function readValue(sc: Scanner): { value: string; end: number } {
	skipWsInline(sc);
	if (sc.s[sc.i] === '"' || sc.s[sc.i] === "'") {
		const quote = sc.s[sc.i];
		const start = ++sc.i;
		while (sc.i < sc.s.length && sc.s[sc.i] !== quote) sc.i++;
		const value = sc.s.slice(start, sc.i);
		if (sc.s[sc.i] === quote) sc.i++; // consume closing quote
		return { value, end: sc.i };
	}
	const start = sc.i;
	while (
		sc.i < sc.s.length &&
		!/\s/.test(sc.s[sc.i]) &&
		sc.s[sc.i] !== ',' &&
		sc.s[sc.i] !== ')' &&
		sc.s[sc.i] !== '(' &&
		// stop at a `..` range separator so `a..b` splits into two values
		!sc.s.startsWith('..', sc.i)
	)
		sc.i++;
	return { value: sc.s.slice(start, sc.i), end: sc.i };
}

function matchOp(s: string, i: number): { code: string; len: number } | null {
	for (const code of OP_CODES) {
		if (s.startsWith(code, i)) return { code, len: code.length };
	}
	return null;
}

/**
 * Peek at an upcoming connective keyword (AND / OR / NOT) without consuming it.
 * A keyword only counts when it stands alone — i.e. it is NOT immediately
 * followed by an operator, so `and:foo` or `or=x` stay field clauses. Returns
 * the keyword and the index just past it, or null.
 */
function peekKeyword(sc: Scanner): { word: string; next: number } | null {
	let j = sc.i;
	while (j < sc.s.length && /\s/.test(sc.s[j])) j++;
	IDENT.lastIndex = j;
	const m = IDENT.exec(sc.s);
	if (!m || m.index !== j) return null;
	const word = m[0].toUpperCase();
	if (!KEYWORDS.has(word)) return null;
	// If an operator follows the ident it is a field name, not a connective.
	let k = j + m[0].length;
	while (sc.s[k] === ' ') k++;
	if (matchOp(sc.s, k)) return null;
	return { word, next: j + m[0].length };
}

export function parse(input: string, schema: Schema): Query {
	const sc: Scanner = { s: input, i: 0 };
	const root = parseOr(sc, schema);
	return { root };
}

// orExpr := andExpr ( OR andExpr )*
function parseOr(sc: Scanner, schema: Schema): ExprNode | null {
	const children: ExprNode[] = [];
	const first = parseAnd(sc, schema);
	if (first) children.push(first);
	for (;;) {
		const kw = peekKeyword(sc);
		if (!kw || kw.word !== 'OR') break;
		sc.i = kw.next;
		const next = parseAnd(sc, schema);
		if (next) children.push(next);
	}
	if (children.length === 0) return first ?? null;
	if (children.length === 1) return children[0];
	return { kind: 'or', children };
}

// andExpr := notExpr ( (AND)? notExpr )*
function parseAnd(sc: Scanner, schema: Schema): ExprNode | null {
	const children: ExprNode[] = [];
	for (;;) {
		skipWs(sc);
		if (sc.i >= sc.s.length) break;
		if (sc.s[sc.i] === ')') break;

		const kw = peekKeyword(sc);
		if (kw?.word === 'OR') break; // let the OR level handle it
		let explicitAnd = false;
		if (kw?.word === 'AND') {
			sc.i = kw.next;
			explicitAnd = true;
		}

		const before = sc.i;
		const node = parseNot(sc, schema);
		if (!node) {
			// No progress → avoid an infinite loop on stray tokens.
			if (sc.i === before) break;
			continue;
		}

		// Merge adjacent implicit-AND free-text words into one TextNode so a bare
		// `foo bar` still matches the contiguous phrase (old flat-AND behaviour).
		const last = children[children.length - 1];
		if (!explicitAnd && node.kind === 'text' && last && last.kind === 'text') {
			last.value += ` ${node.value}`;
			last.span[1] = node.span[1];
			continue;
		}
		children.push(node);
	}
	if (children.length === 0) return null;
	if (children.length === 1) return children[0];
	return { kind: 'and', children };
}

// notExpr := (NOT)? primary
function parseNot(sc: Scanner, schema: Schema): ExprNode | null {
	const kw = peekKeyword(sc);
	if (kw?.word === 'NOT') {
		sc.i = kw.next;
		const child = parseNot(sc, schema);
		if (!child) return null; // dangling NOT → nothing
		return { kind: 'not', child };
	}
	return parsePrimary(sc, schema);
}

// primary := '(' orExpr ')' | filter | text-word
function parsePrimary(sc: Scanner, schema: Schema): ExprNode | null {
	skipWs(sc);
	if (sc.i >= sc.s.length) return null;

	// Parenthesised group.
	if (sc.s[sc.i] === '(') {
		sc.i++;
		const inner = parseOr(sc, schema);
		skipWs(sc);
		if (sc.s[sc.i] === ')') sc.i++; // tolerate a missing close paren
		return inner; // empty group → null
	}
	if (sc.s[sc.i] === ')') return null;

	// A connective keyword here isn't a leaf; let the caller handle it.
	if (peekKeyword(sc)) return null;

	const leaf = readLeaf(sc, schema);
	return leaf;
}

/** Read a single leaf: a `field op value` filter, or one free-text word. */
function readLeaf(sc: Scanner, schema: Schema): LeafNode | null {
	const clauseStart = sc.i;

	IDENT.lastIndex = sc.i;
	const m = IDENT.exec(sc.s);
	if (m && m.index === sc.i) {
		const ident = m[0];
		const afterIdent = sc.i + ident.length;
		const field = findField(schema, ident);
		let j = afterIdent;
		while (sc.s[j] === ' ') j++;
		const inKeyword = sc.s.slice(j, j + 3).toLowerCase() === 'in ' || sc.s.slice(j) === 'in';
		const opMatch = matchOp(sc.s, j);
		if (field && (opMatch || inKeyword)) {
			const node = readFilter(sc, field, clauseStart, j, opMatch, inKeyword);
			if (node) return node;
		}
	}

	// Fallback: consume one word (up to whitespace or a paren) as free text.
	const wStart = sc.i;
	while (sc.i < sc.s.length && !/\s/.test(sc.s[sc.i]) && sc.s[sc.i] !== '(' && sc.s[sc.i] !== ')')
		sc.i++;
	const word = sc.s.slice(wStart, sc.i);
	if (!word) return null;
	return { kind: 'text', value: word, span: [wStart, sc.i] } as TextNode;
}

function readFilter(
	sc: Scanner,
	field: ReturnType<typeof findField> & object,
	clauseStart: number,
	opPos: number,
	opMatch: { code: string; len: number } | null,
	inKeyword: boolean,
): FilterNode | null {
	const legal = operatorsFor(field);

	if (inKeyword) {
		sc.i = opPos + 2; // past `in`
		skipWsInline(sc);
		if (sc.s[sc.i] === '(') sc.i++;
		const values: string[] = [];
		while (sc.i < sc.s.length && sc.s[sc.i] !== ')') {
			skipWsInline(sc);
			if (sc.s[sc.i] === ',') {
				sc.i++;
				continue;
			}
			if (sc.s[sc.i] === ')') break;
			const { value } = readValue(sc);
			if (value) values.push(value);
			else break;
		}
		if (sc.s[sc.i] === ')') sc.i++;
		const op = legal.find((o) => o.id === 'in');
		if (!op) return null;
		return { kind: 'filter', field: field.name, op: 'in', values, span: [clauseStart, sc.i] };
	}

	if (!opMatch) return null;
	const opCode = opMatch.code;
	let op = operatorByCode(opCode);
	// `:` means contains for strings but `is` (eq) for non-string fields.
	if (op && !legal.some((o) => o.id === op?.id)) {
		if (opCode === ':') op = legal.find((o) => o.id === 'eq') ?? op;
	}
	if (!op || !legal.some((o) => o.id === op?.id)) {
		// Operator not legal for this field → degrade: don't consume, treat as text.
		return null;
	}

	sc.i = opPos + opMatch.len;
	const first = readValue(sc);
	// Range form: a..b
	if (sc.s.startsWith('..', sc.i)) {
		sc.i += 2;
		const second = readValue(sc);
		const rangeOp = operatorsFor(field).find((o) => o.id === 'range');
		if (rangeOp) {
			return {
				kind: 'filter',
				field: field.name,
				op: 'range',
				values: [first.value, second.value],
				span: [clauseStart, sc.i],
			};
		}
	}
	return {
		kind: 'filter',
		field: field.name,
		op: op.id,
		values: [first.value],
		span: [clauseStart, sc.i],
	};
}
