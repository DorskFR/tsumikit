// Quoting rules shared by the parser, the serialiser and the editor helpers.
//
// A quote opens a string only where a value may start: at the start of a token
// or right after an operator (`title:"…"`). `"` also opens a free-text phrase at
// a token start; `'` does not, so `don't` and `'tis` stay plain words. Inside a
// quoted string `\"` (or `\'` under `'`) and `\\` are escapes; any other
// backslash is literal, so `"C:\foo"` keeps its backslash.

export const QUOTES = new Set(['"', "'"]);
const OP_TAIL = new Set([':', '=', '<', '>']);

export function isBoundary(c: string | undefined): boolean {
	return c === undefined || /\s/.test(c) || c === '(' || c === ')' || c === ',';
}

/** True when a quote character at index `i` of `s` opens a quoted string. */
export function quoteOpensAt(s: string, i: number): boolean {
	const c = s[i];
	if (!QUOTES.has(c)) return false;
	const prev = s[i - 1];
	if (OP_TAIL.has(prev)) return true;
	return c === '"' && isBoundary(prev);
}

/**
 * Walk `s` up to `end` tracking quote state; returns the quote character still
 * open at `end`, or null. Escaped quotes do not close the string.
 */
export function openQuoteAt(s: string, end: number): string | null {
	let quote: string | null = null;
	for (let i = 0; i < end; i++) {
		const c = s[i];
		if (quote) {
			if (c === '\\' && (s[i + 1] === quote || s[i + 1] === '\\')) i++;
			else if (c === quote) quote = null;
		} else if (quoteOpensAt(s, i)) {
			quote = c;
		}
	}
	return quote;
}

/**
 * Read a quoted string starting at the opening quote `s[start]`. Returns the
 * unescaped value and the index just past the closing quote (or the end of
 * input when it is missing).
 */
export function readQuoted(s: string, start: number): { value: string; end: number } {
	const quote = s[start];
	let value = '';
	let i = start + 1;
	while (i < s.length && s[i] !== quote) {
		if (s[i] === '\\' && (s[i + 1] === quote || s[i + 1] === '\\')) i++;
		value += s[i];
		i++;
	}
	if (s[i] === quote) i++;
	return { value, end: i };
}

/** Wrap `v` in double quotes, escaping what the reader needs to see escaped. */
export function quote(v: string): string {
	const full = /\\\\|\\"|\\$/.test(v);
	const body = (full ? v.replace(/\\/g, '\\\\') : v).replace(/"/g, '\\"');
	return `"${body}"`;
}

const NEEDS_QUOTE = /[\s,()"]|\.\.|^'/;

/** Quote a value unless it survives the parser bare. */
export function quoteIfNeeded(v: string): string {
	return v === '' || NEEDS_QUOTE.test(v) ? quote(v) : v;
}

/** Strip surrounding quotes (a missing closing quote is tolerated) and unescape. */
export function unquote(v: string): string {
	if (!QUOTES.has(v[0])) return v;
	return readQuoted(v, 0).value;
}
