// ─────────────────────────────────────────────────────────────────────────
// Single-key mode — the headless half of FilterInput's `key` prop: the box
// holds the bare value (`/srv/app`, not `cwd:"/srv/app"`), completing through
// the field's own provider, and the equivalent query is synthesised only for
// the `inline` / `below` snippets and the `onchange` AST.
// ─────────────────────────────────────────────────────────────────────────

import { defaultOperator, findField, resolveValues, type Schema } from './schema';
import type { Suggestion, SuggestState } from './suggest';

function quoteIfNeeded(v: string): string {
	return /[\s,()]/.test(v) ? `"${v}"` : v;
}

/**
 * The textual query a bare `value` stands for, using `key`'s default operator —
 * `"/srv/my app"` under key `cwd` becomes `cwd:"/srv/my app"`. Empty values (and
 * unknown keys) yield an empty query so the AST stays empty rather than parsing
 * a half-written clause.
 */
export function singleQuery(schema: Schema, key: string, value: string): string {
	const field = findField(schema, key);
	if (!field || !value) return '';
	return `${field.name}${defaultOperator(field).code}${quoteIfNeeded(value)}`;
}

/**
 * Value suggestions for `key` given the whole box as the fragment. The span
 * always covers the entire value, so accepting an item replaces it outright —
 * there is no field or operator step to advance to.
 */
export async function suggestSingle(
	schema: Schema,
	key: string,
	value: string,
): Promise<SuggestState | null> {
	const field = findField(schema, key);
	if (!field) return null;
	const span: [number, number] = [0, value.length];
	const options = await resolveValues(field, value, { rawQuery: value, span, caret: value.length });
	if (options.length === 0) return null;
	const items: Suggestion[] = options.map((o) => ({
		label: o.label,
		hint: o.hint,
		insert: o.value,
		caret: o.value.length,
	}));
	return { kind: 'value', span, items };
}
