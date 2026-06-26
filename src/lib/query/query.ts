// ─────────────────────────────────────────────────────────────────────────
// AST consumers: serialise back to the textual query (for the code editor and
// the URL), compile to a human-readable SQL-ish WHERE (to prove the filter
// "properly propagates to backend & database"), and compile to a JS predicate
// (our fake in-memory backend).
// ─────────────────────────────────────────────────────────────────────────

import { type FilterNode, filters, freeText, type Query } from './ast';
import { operatorById } from './schema';

function quoteIfNeeded(v: string): string {
	return /[\s,()]/.test(v) || v === '' ? `"${v}"` : v;
}

/** AST → canonical textual query (round-trips through the parser). */
export function serialize(q: Query): string {
	const parts: string[] = [];
	for (const f of filters(q)) parts.push(serializeFilter(f));
	const text = freeText(q);
	if (text) parts.push(text);
	return parts.join(' ');
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

export function toSql(q: Query, table = 'tracks'): string {
	const clauses: string[] = [];
	for (const f of filters(q)) {
		const col = f.field;
		const v = (s: string) => `'${s.replace(/'/g, "''")}'`;
		switch (f.op) {
			case 'contains':
				clauses.push(`${col} ILIKE '%${f.values[0]}%'`);
				break;
			case 'not_contains':
				clauses.push(`${col} NOT ILIKE '%${f.values[0]}%'`);
				break;
			case 'in':
				clauses.push(`${col} IN (${f.values.map(v).join(', ')})`);
				break;
			case 'range':
				clauses.push(`${col} BETWEEN ${v(f.values[0])} AND ${v(f.values[1])}`);
				break;
			default:
				clauses.push(`${col} ${SQL_OP[f.op]} ${v(f.values[0] ?? '')}`);
		}
	}
	const text = freeText(q);
	if (text)
		clauses.push(`to_tsvector(title) @@ plainto_tsquery(${`'${text.replace(/'/g, "''")}'`})`);
	const where = clauses.length ? clauses.join('\n  AND ') : 'TRUE';
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

export function compilePredicate(q: Query): (row: Row) => boolean {
	const fs = filters(q);
	const text = freeText(q).toLowerCase();
	return (row: Row) => {
		for (const f of fs) {
			if (f.values.every((v) => v === '')) continue; // ignore incomplete clauses
			if (!matchFilter(f, row)) return false;
		}
		if (text) {
			const hay = Object.values(row).join(' ').toLowerCase();
			if (!hay.includes(text)) return false;
		}
		return true;
	};
}
