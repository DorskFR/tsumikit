// ─────────────────────────────────────────────────────────────────────────
// Autocomplete engine — the SECOND consumer of the schema (the first is the
// compiler). Given the raw string + caret position it figures out which of the
// three YouTrack-style steps we're in (field → operator → value) and produces
// the suggestion list + the text edit to apply when one is accepted.
//
// This is pure logic, deliberately UI-free so the Svelte organism stays dumb.
// ─────────────────────────────────────────────────────────────────────────

import {
	type FieldDef,
	findField,
	type Operator,
	operatorsFor,
	resolveValues,
	type Schema,
	type ValueOption,
} from './schema';

// Longest first so `>=`/`!:` win over `>`/`:`.
const OP_CODES = ['!:', '!=', '>=', '<=', ':', '=', '>', '<'];

export type SuggestKind = 'field' | 'operator' | 'value';

export interface Suggestion {
	/** What to show on the row. */
	label: string;
	/** Secondary, dimmed line. */
	hint?: string;
	/** Right-aligned monospace token (operator code / field name). */
	code?: string;
	/** The string to splice into the query when accepted. */
	insert: string;
	/** Caret position after the insert (absolute index). */
	caret: number;
	/** When true, keep the dropdown open and advance to the next step. */
	advance?: boolean;
}

export interface SuggestState {
	kind: SuggestKind;
	/** [start, end) of the token region these suggestions replace. */
	span: [number, number];
	items: Suggestion[];
}

/** The whitespace-delimited token under the caret (quotes count as non-ws). */
export function activeToken(s: string, pos: number): { start: number; end: number; raw: string } {
	let start = pos;
	while (start > 0 && !/\s/.test(s[start - 1])) start--;
	let end = pos;
	while (end < s.length && !/\s/.test(s[end])) end++;
	return { start, end, raw: s.slice(start, end) };
}

/** Split a token into field / operator-code / value parts (earliest op wins). */
function splitToken(raw: string): { field: string; opCode: string | null; value: string } {
	let best = -1;
	let bestCode: string | null = null;
	for (const code of OP_CODES) {
		const idx = raw.indexOf(code);
		if (idx === -1) continue;
		// earliest position wins; on a tie the longer code wins (handled by order).
		if (best === -1 || idx < best) {
			best = idx;
			bestCode = code;
		}
	}
	if (bestCode === null) return { field: raw, opCode: null, value: '' };
	return {
		field: raw.slice(0, best),
		opCode: bestCode,
		value: raw.slice(best + bestCode.length),
	};
}

function unquote(v: string): string {
	return v.replace(/^["']|["']$/g, '');
}

function quoteIfNeeded(v: string): string {
	return /[\s,()]/.test(v) ? `"${v}"` : v;
}

function fieldSuggestions(schema: Schema, frag: string, span: [number, number]): SuggestState {
	const q = frag.toLowerCase();
	const items: Suggestion[] = schema.fields
		.filter(
			(f) =>
				!q ||
				f.name.toLowerCase().includes(q) ||
				f.label.toLowerCase().includes(q) ||
				f.aliases?.some((a) => a.toLowerCase().includes(q)),
		)
		.map((f) => {
			const op = operatorsFor(f)[0];
			const insert = `${f.name}${op.code}`;
			return {
				label: f.label,
				hint: f.aliases?.length ? `aka ${f.aliases.join(', ')}` : f.type,
				code: f.name,
				insert,
				caret: span[0] + insert.length,
				advance: true,
			};
		});
	return { kind: 'field', span, items };
}

function operatorSuggestions(field: FieldDef, span: [number, number]): SuggestState {
	const items: Suggestion[] = operatorsFor(field).map((op: Operator) => {
		const insert = `${field.name}${op.code}`;
		return {
			label: op.label,
			code: op.code,
			insert,
			caret: span[0] + insert.length,
			advance: true,
		};
	});
	return { kind: 'operator', span, items };
}

function buildValueState(
	field: FieldDef,
	opCode: string,
	span: [number, number],
	options: ValueOption[],
): SuggestState {
	const items: Suggestion[] = options.map((o) => {
		const insert = `${field.name}${opCode}${quoteIfNeeded(o.value)}`;
		return {
			label: o.label,
			hint: o.hint,
			insert,
			caret: span[0] + insert.length,
		};
	});
	return { kind: 'value', span, items };
}

/**
 * Compute the suggestion state for the caret. Value lookups are async (they may
 * hit the network), so this returns a promise. `null` means "no dropdown".
 */
export async function suggest(
	schema: Schema,
	s: string,
	pos: number,
): Promise<SuggestState | null> {
	const { start, end, raw } = activeToken(s, pos);
	const span: [number, number] = [start, end];

	// Empty caret position (between tokens or empty input) → offer all fields.
	if (raw === '') return fieldSuggestions(schema, '', span);

	const { field: fieldFrag, opCode, value } = splitToken(raw);
	const field = findField(schema, fieldFrag);

	// No operator typed yet.
	if (opCode === null) {
		// Exact field match → it's time to pick an operator.
		if (field && fieldFrag.toLowerCase() === field.name.toLowerCase()) {
			return operatorSuggestions(field, span);
		}
		// Otherwise we're still completing the field name.
		return fieldSuggestions(schema, fieldFrag, span);
	}

	// Operator present but field unknown → nothing useful to suggest.
	if (!field) return null;

	// Operator present → suggest values (async; filtered by what's typed).
	const opts = await resolveValues(field, unquote(value));
	if (opts.length === 0) return null;
	return buildValueState(field, opCode, span, opts);
}
