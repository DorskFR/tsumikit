// ─────────────────────────────────────────────────────────────────────────
// Layer 1 — the schema / field registry.
//
// The single source of truth that drives BOTH the autocomplete UI and the
// backend compiler. For each searchable field we declare its type, aliases,
// the operators it allows and a value provider (static enum or async lookup).
// Nothing here is UI: it's plain data a host app supplies.
// ─────────────────────────────────────────────────────────────────────────

export type FieldType = 'string' | 'enum' | 'id' | 'date' | 'number' | 'bool';

/** A comparison operator. `code` is how it serialises in the textual query. */
export type OperatorId =
	| 'contains'
	| 'not_contains'
	| 'eq'
	| 'ne'
	| 'gt'
	| 'gte'
	| 'lt'
	| 'lte'
	| 'in'
	| 'range';

export interface Operator {
	id: OperatorId;
	/** Human label shown in the operator dropdown (YouTrack "一致する" etc.). */
	label: string;
	/** Textual form used by the code parser/serialiser, e.g. `>=`, `:`, `!:`. */
	code: string;
	/** Types this operator can apply to. */
	types: FieldType[];
	/** range/in take two / many values. */
	arity?: 'one' | 'two' | 'many';
}

// The full operator catalogue. The order here is the order shown in dropdowns.
export const OPERATORS: Operator[] = [
	{ id: 'contains', label: 'includes', code: ':', types: ['string'] },
	{ id: 'not_contains', label: 'does not include', code: '!:', types: ['string'] },
	{ id: 'eq', label: 'is', code: '=', types: ['enum', 'id', 'number', 'bool', 'date'] },
	{ id: 'ne', label: 'is not', code: '!=', types: ['enum', 'id', 'number', 'bool', 'date'] },
	{ id: 'gt', label: 'greater than', code: '>', types: ['number', 'date'] },
	{ id: 'gte', label: 'greater or equal', code: '>=', types: ['number', 'date'] },
	{ id: 'lt', label: 'less than', code: '<', types: ['number', 'date'] },
	{ id: 'lte', label: 'less or equal', code: '<=', types: ['number', 'date'] },
	{ id: 'in', label: 'any of', code: 'in', types: ['enum', 'id'], arity: 'many' },
	{ id: 'range', label: 'in range', code: '..', types: ['date', 'number'], arity: 'two' },
];

export interface ValueOption {
	value: string;
	label: string;
	/** Optional secondary line (e.g. an email under a username). */
	hint?: string;
}

/**
 * Extra context handed to a {@link ValueProvider} alongside the value fragment:
 * the full raw query, the active replacement span (`[start, end)` offsets of the
 * text a chosen suggestion would replace) and the caret position. Optional so
 * existing providers that only read the fragment keep working unchanged.
 */
export interface ValueContext {
	/** The full query string the fragment was extracted from. */
	rawQuery: string;
	/** `[start, end)` offsets of the token region a suggestion would replace. */
	span: [number, number];
	/** Absolute caret index within `rawQuery`. */
	caret: number;
}

/** Resolves candidate values for a field given the user's partial input. */
export type ValueProvider = (
	query: string,
	context?: ValueContext,
) => ValueOption[] | Promise<ValueOption[]>;

export interface FieldDef {
	/** Canonical name, used in the serialised query (e.g. `artist`). */
	name: string;
	/** Display label (e.g. `Artist`). */
	label: string;
	type: FieldType;
	/** Alternate spellings accepted by the parser (e.g. `by` → assignee). */
	aliases?: string[];
	/** Static options, or omit and supply `provider` for async lookups. */
	options?: ValueOption[];
	provider?: ValueProvider;
	/**
	 * Restrict the operators offered for this field to exactly this set (in
	 * catalogue order). When omitted, all operators legal for the field's `type`
	 * are offered. Use this to mirror a backend registry's per-field whitelist so
	 * the dropdown — and the parser's legal-op check — match what the server
	 * actually accepts.
	 */
	operators?: OperatorId[];
	/** Placeholder shown in the value step of the dropdown. */
	valuePlaceholder?: string;
}

export interface Schema {
	fields: FieldDef[];
}

/** Operators legal for a given field, in catalogue order. When the field
 *  declares an explicit `operators` whitelist that takes precedence over the
 *  type-derived set (the whitelist is authoritative); otherwise every operator
 *  legal for the field's `type` is returned. */
export function operatorsFor(field: FieldDef): Operator[] {
	if (field.operators) {
		const allow = new Set(field.operators);
		return OPERATORS.filter((op) => allow.has(op.id));
	}
	return OPERATORS.filter((op) => op.types.includes(field.type));
}

/** The default operator picked when a user selects a field (YouTrack-like). */
export function defaultOperator(field: FieldDef): Operator {
	return operatorsFor(field)[0];
}

export function findField(schema: Schema, token: string): FieldDef | undefined {
	const t = token.toLowerCase();
	return schema.fields.find(
		(f) => f.name.toLowerCase() === t || f.aliases?.some((a) => a.toLowerCase() === t),
	);
}

export function operatorByCode(code: string): Operator | undefined {
	return OPERATORS.find((op) => op.code === code);
}

export function operatorById(id: OperatorId): Operator | undefined {
	return OPERATORS.find((op) => op.id === id);
}

/** Resolve a field's value options (sync wrapper that always returns a promise). */
export async function resolveValues(
	field: FieldDef,
	query: string,
	context?: ValueContext,
): Promise<ValueOption[]> {
	if (field.provider) return field.provider(query, context);
	const opts = field.options ?? [];
	const q = query.toLowerCase();
	return q ? opts.filter((o) => o.label.toLowerCase().includes(q)) : opts;
}
