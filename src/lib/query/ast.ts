// ─────────────────────────────────────────────────────────────────────────
// The AST — the serialisable contract that the parser produces and that BOTH
// the autocomplete UI and the backend compiler consume. The frontend never
// asks the server to re-parse free text; it ships this tree (or the server
// runs the same parser and gets the same tree).
// ─────────────────────────────────────────────────────────────────────────

import type { OperatorId } from './schema';

/** A single `field op value(s)` clause. */
export interface FilterNode {
	kind: 'filter';
	field: string; // canonical field name
	op: OperatorId;
	/** One value for most ops; two for range; many for `in`. */
	values: string[];
	/** Source span [start, end) in the raw string — used by the UI for editing. */
	span: [number, number];
}

/** Leftover free-text term (full-text / fuzzy search on the backend). */
export interface TextNode {
	kind: 'text';
	value: string;
	span: [number, number];
}

export type QueryNode = FilterNode | TextNode;

export interface Query {
	/** Clauses are AND-combined (YouTrack semantics). */
	nodes: QueryNode[];
}

export function filters(q: Query): FilterNode[] {
	return q.nodes.filter((n): n is FilterNode => n.kind === 'filter');
}

export function freeText(q: Query): string {
	return q.nodes
		.filter((n): n is TextNode => n.kind === 'text')
		.map((n) => n.value)
		.join(' ')
		.trim();
}
