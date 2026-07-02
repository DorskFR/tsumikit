// ─────────────────────────────────────────────────────────────────────────
// The AST — the serialisable contract that the parser produces and that BOTH
// the autocomplete UI and the backend compiler consume. The frontend never
// asks the server to re-parse free text; it ships this tree (or the server
// runs the same parser and gets the same tree).
//
// The tree is a boolean expression: `And` / `Or` / `Not` nodes wrap the leaf
// `FilterNode` / `TextNode`. The leaf shapes are unchanged from the flat-AND
// era, so `schema.ts` and value providers are untouched. A query with no
// explicit `OR` / `NOT` / parens parses to a single `And` of its leaves — the
// same result set as the old implicit-AND clause list.
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

/** Conjunction — every child must match. Implicit between adjacent clauses. */
export interface AndNode {
	kind: 'and';
	children: ExprNode[];
}

/** Disjunction — at least one child must match. Written with `OR`. */
export interface OrNode {
	kind: 'or';
	children: ExprNode[];
}

/** Boolean negation of a whole sub-expression. Written with `NOT`. */
export interface NotNode {
	kind: 'not';
	child: ExprNode;
}

/** A leaf of the expression tree. */
export type LeafNode = FilterNode | TextNode;

/** Any node in the boolean expression tree. */
export type ExprNode = AndNode | OrNode | NotNode | LeafNode;

/**
 * Backwards-compatible alias for a leaf node. Historically `QueryNode` was the
 * only node type (the tree was a flat list of these); it now names the leaf
 * union so existing type imports keep resolving.
 */
export type QueryNode = LeafNode;

export interface Query {
	/** Root of the boolean expression tree, or `null` for an empty query. */
	root: ExprNode | null;
}

/** Depth-first walk of every node in the tree (leaves included). */
export function walk(node: ExprNode | null, visit: (n: ExprNode) => void): void {
	if (!node) return;
	visit(node);
	switch (node.kind) {
		case 'and':
		case 'or':
			for (const c of node.children) walk(c, visit);
			break;
		case 'not':
			walk(node.child, visit);
			break;
	}
}

/** Every filter leaf in the tree, in source order. */
export function filters(q: Query): FilterNode[] {
	const out: FilterNode[] = [];
	walk(q.root, (n) => {
		if (n.kind === 'filter') out.push(n);
	});
	return out;
}

/** All free-text leaves joined — the flat full-text fragment. */
export function freeText(q: Query): string {
	const parts: string[] = [];
	walk(q.root, (n) => {
		if (n.kind === 'text') parts.push(n.value);
	});
	return parts.join(' ').trim();
}
