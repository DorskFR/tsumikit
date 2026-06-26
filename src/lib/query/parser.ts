// ─────────────────────────────────────────────────────────────────────────
// Layer 2 — a tolerant, error-recovering parser.
//
// Hand-written scanner (not a strict grammar generator) precisely BECAUSE the
// operators are "free for all": we must parse partial input (`artist:` with no
// value, for autocomplete) and slightly-wrong input (a malformed clause must
// degrade to free text, never throw). Output is the serialisable AST in ast.ts.
//
// Textual forms understood:
//   artist:"Daft Punk"          → contains
//   artist!:bootleg             → not_contains
//   year>=2021  released<2020   → numeric/date comparisons
//   status=released  by!=me     → is / is not
//   genre in (house, techno)    → any of
//   year..2021..2024            → range  (field..a..b)  also  field:a..b
//   free floating words         → TextNode (full-text)
//   AND / and                   → ignored separator (clauses are implicitly AND)
// ─────────────────────────────────────────────────────────────────────────

import type { FilterNode, Query, QueryNode, TextNode } from './ast';
import { findField, operatorByCode, operatorsFor, type Schema } from './schema';

const IDENT = /[A-Za-z_][\w-]*/y;
// Longest operator codes first so `>=` wins over `>`.
const OP_CODES = ['!:', '!=', '>=', '<=', ':', '=', '>', '<'];

interface Scanner {
	s: string;
	i: number;
}

function skipWs(sc: Scanner) {
	while (sc.i < sc.s.length && /\s/.test(sc.s[sc.i])) sc.i++;
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
		// stop at a `..` range separator so `a..b` splits into two values
		!sc.s.startsWith('..', sc.i)
	)
		sc.i++;
	return { value: sc.s.slice(start, sc.i), end: sc.i };
}

// Only skip spaces/tabs, never cross to a new token boundary semantics; used so
// `artist: foo` (space after colon) still attaches `foo` as the value.
function skipWsInline(sc: Scanner) {
	while (sc.i < sc.s.length && (sc.s[sc.i] === ' ' || sc.s[sc.i] === '\t')) sc.i++;
}

function matchOp(s: string, i: number): { code: string; len: number } | null {
	for (const code of OP_CODES) {
		if (s.startsWith(code, i)) return { code, len: code.length };
	}
	return null;
}

export function parse(input: string, schema: Schema): Query {
	const sc: Scanner = { s: input, i: 0 };
	const nodes: QueryNode[] = [];

	while (sc.i < sc.s.length) {
		skipWs(sc);
		if (sc.i >= sc.s.length) break;
		const clauseStart = sc.i;

		// Try to read an identifier (potential field name).
		IDENT.lastIndex = sc.i;
		const m = IDENT.exec(sc.s);
		if (m && m.index === sc.i) {
			const ident = m[0];
			const afterIdent = sc.i + ident.length;

			// `AND` / `and` — implicit-AND separator, skip it.
			if (ident.toUpperCase() === 'AND') {
				sc.i = afterIdent;
				continue;
			}

			const field = findField(schema, ident);
			// Look for an operator right after the identifier (allow inline spaces).
			let j = afterIdent;
			while (sc.s[j] === ' ') j++;
			const inKeyword = sc.s.slice(j, j + 3).toLowerCase() === 'in ' || sc.s.slice(j) === 'in';
			const opMatch = matchOp(sc.s, j);

			if (field && (opMatch || inKeyword)) {
				const node = readFilter(sc, field, clauseStart, j, opMatch, inKeyword);
				if (node) {
					nodes.push(node);
					continue;
				}
			}
		}

		// Fallback: consume one whitespace-delimited word as free text.
		const wStart = sc.i;
		while (sc.i < sc.s.length && !/\s/.test(sc.s[sc.i])) sc.i++;
		const word = sc.s.slice(wStart, sc.i);
		if (word) {
			const last = nodes[nodes.length - 1];
			if (last && last.kind === 'text') {
				last.value += ` ${word}`;
				last.span[1] = sc.i;
			} else {
				nodes.push({ kind: 'text', value: word, span: [wStart, sc.i] } as TextNode);
			}
		}
	}

	return { nodes };
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
