// Character-count truncation — a pure string helper, the counterpart to the
// CSS single-line ellipsis on <Text truncate>. CSS can clip to the available
// width but can't truncate in the *middle* (e.g. `0x1234…cdef` for hashes) or
// guarantee a minimum number of visible chars; this does, working on the string
// itself. It is layout-agnostic: it does not react to container resize or font
// scaling — reach for <Text truncate> when you want responsive end-clipping,
// and this when you need deterministic, content-aware shortening.
//
// Counting is by code point (spread into an array) so astral characters and
// most emoji are not split mid-surrogate. It is not grapheme-cluster aware, so
// combining marks / ZWJ sequences can still be cut; that trade-off keeps it
// dependency-free.

export type TruncateMode = 'end' | 'middle' | 'start' | 'path';

export interface TruncateOptions {
	/** Maximum number of characters in the result, ellipsis included. */
	max: number;
	/** Where the ellipsis goes. Default 'end'. */
	mode?: TruncateMode;
	/** Ellipsis string. Default '…' (one char). */
	ellipsis?: string;
	/** `path` mode: segment separator. Default '/'. */
	separator?: string;
	/** `path` mode: chars the leaf keeps at minimum before the ellipsis. Default 3. */
	minLeaf?: number;
	/** `path` mode: leading segments never abbreviated (e.g. 1 keeps `~`). Default 0. */
	keepFirst?: number;
}

/**
 * Path renderings richest → poorest: full, ancestors abbreviated to their first
 * char left to right, leading ancestors dropped behind the ellipsis, leaf only,
 * leaf end-truncated down to `minLeaf` chars.
 */
export function pathCandidates(
	value: string,
	options: Omit<TruncateOptions, 'max' | 'mode'> = {},
): string[] {
	const { ellipsis = '…', separator = '/', minLeaf = 3, keepFirst = 0 } = options;
	const trimmed =
		value.endsWith(separator) && value.length > separator.length
			? value.slice(0, -separator.length)
			: value;
	const absolute = trimmed.startsWith(separator);
	const segs = trimmed.split(separator).filter(Boolean);
	if (segs.length === 0) return [trimmed || separator];
	const leaf = segs[segs.length - 1];
	const parents = segs.slice(0, -1);
	const out: string[] = [];
	const push = (c: string) => {
		if (out[out.length - 1] !== c && !out.includes(c)) out.push(c);
	};
	const join = (parts: string[]) => (absolute ? separator : '') + parts.join(separator);
	for (let n = 0; n <= parents.length; n++) {
		push(
			join([...parents.map((p, i) => (i >= keepFirst && i < keepFirst + n ? [...p][0] : p)), leaf]),
		);
	}
	const abbreviated = parents.map((p, i) => (i >= keepFirst ? [...p][0] : p));
	for (let drop = 1; drop < abbreviated.length; drop++) {
		push(`${ellipsis}${separator}${[...abbreviated.slice(drop), leaf].join(separator)}`);
	}
	push(leaf);
	for (let keep = [...leaf].length - 1; keep >= minLeaf; keep--) {
		push(truncate(leaf, { max: keep + [...ellipsis].length, mode: 'end', ellipsis }));
	}
	return out;
}

/**
 * Shorten `value` to at most `max` characters (counting the ellipsis), or
 * return it unchanged when it already fits. Returns the original string when
 * `max` is too small to show any content alongside the ellipsis.
 */
export function truncate(value: string, options: TruncateOptions): string {
	const { max, mode = 'end', ellipsis = '…' } = options;
	const chars = [...value];
	if (chars.length <= max) return value;

	if (mode === 'path') {
		const candidates = pathCandidates(value, options);
		return candidates.find((c) => [...c].length <= max) ?? candidates[candidates.length - 1];
	}

	const ell = [...ellipsis];
	const budget = max - ell.length; // chars of real content we can keep
	// Not enough room for the ellipsis plus any content: don't produce a string
	// that's all-ellipsis (misleading) — hand back the original and let CSS /
	// the caller deal with overflow.
	if (budget <= 0) return value;

	if (mode === 'start') {
		return ellipsis + chars.slice(chars.length - budget).join('');
	}
	if (mode === 'middle') {
		// Bias the extra char to the front so the start (often the more
		// identifying part) keeps one more character on odd budgets.
		const head = Math.ceil(budget / 2);
		const tail = budget - head;
		const start = chars.slice(0, head).join('');
		const end = tail > 0 ? chars.slice(chars.length - tail).join('') : '';
		return start + ellipsis + end;
	}
	// 'end'
	return chars.slice(0, budget).join('') + ellipsis;
}
