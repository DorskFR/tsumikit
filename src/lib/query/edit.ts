// ─────────────────────────────────────────────────────────────────────────
// Editor affordances — pure text edits an input host applies as the user types.
//
// The parser treats an unquoted value as ending at the first space, so
// `title:star wars` means `title:star` + free-text `wars`. To type a multi-word
// value the user otherwise has to add the quotes by hand. These helpers let the
// FilterSearchBar auto-insert the `""` pair the moment a string field's value
// step opens, so spaces land inside the quotes — the already-supported phrase
// form — without any grammar change. UI-free and framework-agnostic.
// ─────────────────────────────────────────────────────────────────────────

import { findField, type Schema } from './schema';

// A field name immediately followed by a string operator (`:` contains / `!:`
// not-contains), anchored at the caret.
const STRING_CLAUSE = /([A-Za-z_][\w-]*)(!?:)$/;

function isQuote(c: string | undefined): boolean {
	return c === '"' || c === "'";
}

/**
 * When the text just before `pos` completes a string field's operator
 * (`title:` / `title!:`) and no quote already follows, return the value with an
 * empty `""` pair spliced in at `pos` and the caret parked between them. Returns
 * `null` when it does not apply.
 */
export function autoQuoteEdit(
	schema: Schema,
	value: string,
	pos: number,
): { value: string; pos: number } | null {
	if (isQuote(value[pos])) return null;
	const m = STRING_CLAUSE.exec(value.slice(0, pos));
	if (!m) return null;
	const field = findField(schema, m[1]);
	if (field?.type !== 'string') return null;
	return { value: `${value.slice(0, pos)}""${value.slice(pos)}`, pos: pos + 1 };
}

// Scan from the start tracking quote state (spaces inside quotes are NOT
// boundaries), so the caret's quote context is correct even for `"star wars"`.
function openQuoteAt(value: string, pos: number): string | null {
	let quote: string | null = null;
	for (let i = 0; i < pos; i++) {
		const c = value[i];
		if (quote) {
			if (c === quote) quote = null;
		} else if (isQuote(c)) {
			quote = c;
		}
	}
	return quote;
}

/** True when the caret sits inside an open quote. */
export function insideQuoteAtCaret(value: string, pos: number): boolean {
	return openQuoteAt(value, pos) !== null;
}

/**
 * If the caret is inside a quote and its closing quote follows, return the index
 * just past that quote (where Tab should move the caret to); otherwise `null`.
 */
export function closingQuoteExit(value: string, pos: number): number | null {
	const quote = openQuoteAt(value, pos);
	if (!quote) return null;
	for (let i = pos; i < value.length; i++) {
		if (value[i] === quote) return i + 1;
	}
	return null;
}

/**
 * If the caret sits between an empty matching quote pair (`"|"`), return the
 * value with both quotes removed so a Backspace clears an unwanted auto-quote
 * instead of leaving an orphan.
 */
export function backspaceEmptyQuotes(
	value: string,
	pos: number,
): { value: string; pos: number } | null {
	const open = value[pos - 1];
	if (!isQuote(open) || value[pos] !== open) return null;
	return { value: value.slice(0, pos - 1) + value.slice(pos + 1), pos: pos - 1 };
}
