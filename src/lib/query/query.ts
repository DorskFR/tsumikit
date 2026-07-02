// ─────────────────────────────────────────────────────────────────────────
// AST consumers: serialise back to the textual query (for the code editor and
// the URL), compile to a human-readable SQL-ish WHERE (to prove the filter
// "properly propagates to backend & database"), and compile to a JS predicate
// (our fake in-memory backend). All three walk the boolean expression tree with
// correct precedence / grouping / short-circuiting.
// ─────────────────────────────────────────────────────────────────────────

import type { ExprNode, FilterNode, Query } from './ast';
import { operatorById } from './schema';

function quoteIfNeeded(v: string): string {
	return /[\s,()]/.test(v) || v === '' ? `"${v}"` : v;
}

// ── Serialiser (AST → canonical textual query, round-trips through parse) ────

/** Precedence rank: higher binds tighter. Leaves are atomic. */
function rank(node: ExprNode): number {
	switch (node.kind) {
		case 'or':
			return 1;
		case 'and':
			return 2;
		case 'not':
			return 3;
		default:
			return 4; // leaf
	}
}

/** Serialise `node`, wrapping in parens when its precedence is below `min`. */
function serializeNode(node: ExprNode, min: number): string {
	const s = serializeBare(node);
	return rank(node) < min ? `(${s})` : s;
}

function serializeBare(node: ExprNode): string {
	switch (node.kind) {
		case 'filter':
			return serializeFilter(node);
		case 'text':
			return node.value;
		case 'not':
			// Child must bind at least as tight as NOT, else parenthesise.
			return `NOT ${serializeNode(node.child, 3)}`;
		case 'and':
			// Children need to sit above OR precedence; AND itself is implicit (space).
			return node.children.map((c) => serializeNode(c, 2)).join(' ');
		case 'or':
			return node.children.map((c) => serializeNode(c, 1)).join(' OR ');
	}
}

/** AST → canonical textual query (round-trips through the parser). */
export function serialize(q: Query): string {
	return q.root ? serializeBare(q.root) : '';
}

export function serializeFilter(f: FilterNode): string {
	const op = operatorById(f.op);
	if (!op) return '';
	if (f.op === 'in') return `${f.field} in (${f.values.map(quoteIfNeeded).join(', ')})`;
	if (f.op === 'range')
		return `${f.field}:${quoteIfNeeded(f.values[0])}..${quoteIfNeeded(f.values[1])}`;
	return `${f.field}${op.code}${quoteIfNeeded(f.values[0] ?? '')}`;
}

// ── SQL-ish compiler (illustrative — what the server would emit) ────────────

const SQL_OP: Record<string, string> = {
	eq: '=',
	ne: '<>',
	gt: '>',
	gte: '>=',
	lt: '<',
	lte: '<=',
};

function sqlLiteral(s: string): string {
	return `'${s.replace(/'/g, "''")}'`;
}

function filterToSql(f: FilterNode): string {
	const col = f.field;
	switch (f.op) {
		case 'contains':
			return `${col} ILIKE '%${f.values[0]}%'`;
		case 'not_contains':
			return `${col} NOT ILIKE '%${f.values[0]}%'`;
		case 'in':
			return `${col} IN (${f.values.map(sqlLiteral).join(', ')})`;
		case 'range':
			return `${col} BETWEEN ${sqlLiteral(f.values[0])} AND ${sqlLiteral(f.values[1])}`;
		default:
			return `${col} ${SQL_OP[f.op]} ${sqlLiteral(f.values[0] ?? '')}`;
	}
}

/** Serialise a node to a SQL boolean expression, parenthesising sub-groups. */
function nodeToSql(node: ExprNode): string {
	switch (node.kind) {
		case 'filter':
			return filterToSql(node);
		case 'text':
			return `to_tsvector(title) @@ plainto_tsquery(${sqlLiteral(node.value)})`;
		case 'not':
			return `NOT (${nodeToSql(node.child)})`;
		case 'and':
			return node.children.map((c) => `(${nodeToSql(c)})`).join(' AND ');
		case 'or':
			return node.children.map((c) => `(${nodeToSql(c)})`).join(' OR ');
	}
}

export function toSql(q: Query, table = 'tracks'): string {
	const where = q.root ? nodeToSql(q.root) : 'TRUE';
	return `SELECT * FROM ${table}\nWHERE ${where};`;
}

// ── JS predicate compiler (our fake backend runs this in-memory) ────────────

type Row = Record<string, unknown>;

function asNumber(v: unknown): number {
	if (typeof v === 'number') return v;
	const s = String(v).trim();
	// Plain integer/decimal (a year "2000", a play count) — take it literally.
	// Guard against Date.parse swallowing "2000" as a year-timestamp.
	if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
	const d = Date.parse(s); // real dates like "2021-02-01" compare by epoch ms
	if (!Number.isNaN(d)) return d;
	return Number(s);
}

function matchFilter(f: FilterNode, row: Row): boolean {
	const cell = row[f.field];
	const target = f.values[0] ?? '';
	const cellStr = String(cell ?? '').toLowerCase();
	switch (f.op) {
		case 'contains':
			return cellStr.includes(target.toLowerCase());
		case 'not_contains':
			return !cellStr.includes(target.toLowerCase());
		case 'eq':
			return cellStr === target.toLowerCase();
		case 'ne':
			return cellStr !== target.toLowerCase();
		case 'in':
			return f.values.map((x) => x.toLowerCase()).includes(cellStr);
		case 'range':
			return asNumber(cell) >= asNumber(f.values[0]) && asNumber(cell) <= asNumber(f.values[1]);
		case 'gt':
			return asNumber(cell) > asNumber(target);
		case 'gte':
			return asNumber(cell) >= asNumber(target);
		case 'lt':
			return asNumber(cell) < asNumber(target);
		case 'lte':
			return asNumber(cell) <= asNumber(target);
		default:
			return true;
	}
}

/**
 * Is this leaf still incomplete (mid-typing)? Such leaves are neutral — they
 * neither match nor reject — so a half-written clause never changes the result
 * set, matching the old flat-AND "ignore incomplete clauses" behaviour.
 */
function isIncomplete(node: ExprNode): boolean {
	if (node.kind === 'filter') return node.values.every((v) => v === '');
	if (node.kind === 'text') return node.value.trim() === '';
	return false;
}

/** Evaluate a node against a row. `null` = neutral (skip / don't constrain). */
function evalNode(node: ExprNode, row: Row): boolean | null {
	if (isIncomplete(node)) return null;
	switch (node.kind) {
		case 'filter':
			return matchFilter(node, row);
		case 'text': {
			const hay = Object.values(row).join(' ').toLowerCase();
			return hay.includes(node.value.trim().toLowerCase());
		}
		case 'not': {
			const inner = evalNode(node.child, row);
			return inner === null ? null : !inner;
		}
		case 'and': {
			let sawReal = false;
			for (const c of node.children) {
				const r = evalNode(c, row);
				if (r === null) continue; // neutral
				sawReal = true;
				if (!r) return false;
			}
			return sawReal ? true : null;
		}
		case 'or': {
			let sawReal = false;
			for (const c of node.children) {
				const r = evalNode(c, row);
				if (r === null) continue;
				sawReal = true;
				if (r) return true;
			}
			return sawReal ? false : null;
		}
	}
}

export function compilePredicate(q: Query): (row: Row) => boolean {
	const root = q.root;
	return (row: Row) => {
		if (!root) return true;
		const r = evalNode(root, row);
		return r === null ? true : r;
	};
}
