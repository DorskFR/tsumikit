/**
 * @typedef {{ type: 'open', index?: number }
 *   | { type: 'close' }
 *   | { type: 'select' }
 *   | { type: 'move', index: number }
 *   | { type: 'change', index: number }
 *   | { type: 'reorder', from: number, to: number }
 *   | { type: 'trailing' }
 *   | { type: 'type', char: string }} RichSelectAction
 */

/**
 * Map a keydown on the trigger to what the select does with it. Closed, the
 * arrows step the value like a native select and Enter/Space/Alt+ArrowDown open.
 * Open, the arrows and Home/End move the active option, Enter/Space select,
 * Escape closes, Alt+arrows reorder (when `reorder` is set), and Tab or
 * ArrowRight reach the active option's trailing actions (when it has any).
 * Printable characters feed the typeahead in both states. `undefined` leaves
 * the key alone.
 *
 * @param {{ key: string, altKey?: boolean, ctrlKey?: boolean, metaKey?: boolean, shiftKey?: boolean }} e
 * @param {{ open: boolean, count: number, index: number, reorder?: boolean, trailing?: boolean }} state
 * @returns {RichSelectAction | undefined}
 */
export function richSelectAction(e, { open, count, index, reorder = false, trailing = false }) {
	const { key } = e;
	if (e.ctrlKey || e.metaKey) return undefined;
	const last = count - 1;
	const cur = index >= 0 && index <= last ? index : -1;
	if (!open) {
		if (e.altKey) return key === 'ArrowDown' ? { type: 'open' } : undefined;
		if (key === 'Enter' || key === ' ') return { type: 'open' };
		if (count <= 0) return undefined;
		if (key === 'ArrowDown')
			return { type: 'change', index: cur < 0 ? 0 : Math.min(cur + 1, last) };
		if (key === 'ArrowUp') return { type: 'change', index: cur < 0 ? last : Math.max(cur - 1, 0) };
		if (key === 'Home') return { type: 'change', index: 0 };
		if (key === 'End') return { type: 'change', index: last };
		return printable(e) ? { type: 'type', char: key } : undefined;
	}
	if (key === 'Escape') return { type: 'close' };
	if (e.altKey) {
		if (key === 'ArrowUp' && reorder && cur > 0) return { type: 'reorder', from: cur, to: cur - 1 };
		if (key === 'ArrowDown' && reorder && cur >= 0 && cur < last)
			return { type: 'reorder', from: cur, to: cur + 1 };
		if (key === 'ArrowUp' && !reorder) return { type: 'select' };
		return undefined;
	}
	if ((key === 'Tab' && !e.shiftKey) || key === 'ArrowRight')
		return trailing && cur >= 0 ? { type: 'trailing' } : undefined;
	if (key === 'Tab') return { type: 'close' };
	if (key === 'Enter' || key === ' ') return cur >= 0 ? { type: 'select' } : { type: 'close' };
	if (count <= 0) return undefined;
	if (key === 'ArrowDown') return { type: 'move', index: cur < 0 ? 0 : Math.min(cur + 1, last) };
	if (key === 'ArrowUp') return { type: 'move', index: cur < 0 ? last : Math.max(cur - 1, 0) };
	if (key === 'Home') return { type: 'move', index: 0 };
	if (key === 'End') return { type: 'move', index: last };
	return printable(e) ? { type: 'type', char: key } : undefined;
}

/** @param {{ key: string, altKey?: boolean }} e */
function printable(e) {
	return e.key.length === 1 && !e.altKey && e.key !== ' ';
}

/**
 * Index of the first label, searching forward from `from` and wrapping, that
 * starts with `query` (case- and accent-insensitive). A query of one repeated
 * character cycles through the labels starting with it, as native selects do.
 *
 * @param {readonly string[]} labels
 * @param {string} query
 * @param {number} from index of the current option, or -1
 * @returns {number | undefined}
 */
export function typeaheadIndex(labels, query, from) {
	const n = labels.length;
	if (n === 0 || query === '') return undefined;
	const fold = (/** @type {string} */ s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
	const q = fold(query);
	const repeated = [...q].every((c) => c === q[0]);
	const needle = repeated ? q[0] : q;
	const start = repeated ? from + 1 : Math.max(from, 0);
	for (let i = 0; i < n; i += 1) {
		const at = (((start + i) % n) + n) % n;
		if (fold(labels[at]).startsWith(needle)) return at;
	}
	return undefined;
}

/**
 * Accumulates typed characters into a query that resets after `timeout` ms of
 * silence.
 *
 * @param {number} [timeout]
 * @param {() => number} [now]
 */
export function createTypeahead(timeout = 500, now = () => Date.now()) {
	let query = '';
	let at = -Infinity;
	return {
		/** @param {string} char */
		push(char) {
			const t = now();
			query = t - at > timeout ? char : query + char;
			at = t;
			return query;
		},
		reset() {
			query = '';
			at = -Infinity;
		},
	};
}
