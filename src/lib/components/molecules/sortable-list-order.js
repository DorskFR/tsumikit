/**
 * Move the entry at `from` to `to`, returning a new array.
 *
 * @template T
 * @param {T[]} list
 * @param {number} from
 * @param {number} to
 * @returns {T[]}
 */
export function moveItem(list, from, to) {
	const next = [...list];
	if (from < 0 || from >= next.length) return next;
	const clamped = Math.min(Math.max(to, 0), next.length - 1);
	const [moved] = next.splice(from, 1);
	next.splice(clamped, 0, moved);
	return next;
}

/**
 * True when both key lists hold the same keys, in any order.
 *
 * @param {string[]} a
 * @param {string[]} b
 */
export function sameKeys(a, b) {
	if (a.length !== b.length) return false;
	const set = new Set(a);
	return b.every((k) => set.has(k));
}

/**
 * The nearest index from `from` in direction `dir` that `allowed` accepts,
 * skipping vetoed slots. `undefined` when nothing in that direction is allowed.
 *
 * @param {number} from
 * @param {number} count
 * @param {1 | -1} dir
 * @param {(to: number) => boolean} allowed
 * @returns {number | undefined}
 */
export function stepTarget(from, count, dir, allowed) {
	for (let to = from + dir; to >= 0 && to < count; to += dir) {
		if (allowed(to)) return to;
	}
	return undefined;
}

/**
 * The farthest index toward `edge` that `allowed` accepts.
 *
 * @param {number} from
 * @param {number} count
 * @param {'start' | 'end'} edge
 * @param {(to: number) => boolean} allowed
 * @returns {number | undefined}
 */
export function edgeTarget(from, count, edge, allowed) {
	if (edge === 'start') {
		for (let to = 0; to < from; to += 1) if (allowed(to)) return to;
	} else {
		for (let to = count - 1; to > from; to -= 1) if (allowed(to)) return to;
	}
	return undefined;
}

/**
 * Resolve a key pressed on a grabbed grip to a list action.
 *
 * @param {string} key
 * @returns {'up' | 'down' | 'start' | 'end' | 'drop' | 'cancel' | undefined}
 */
export function grabbedAction(key) {
	switch (key) {
		case 'ArrowUp':
			return 'up';
		case 'ArrowDown':
			return 'down';
		case 'Home':
			return 'start';
		case 'End':
			return 'end';
		case ' ':
		case 'Enter':
			return 'drop';
		case 'Escape':
			return 'cancel';
		default:
			return undefined;
	}
}

/**
 * Slot a dragged row lands in: the one whose top is nearest the dragged row's
 * top. `heights` are the other rows, top to bottom; `top` is relative to the
 * first slot.
 *
 * @param {number} top
 * @param {number[]} heights
 * @returns {number}
 */
export function slotForTop(top, heights) {
	let best = 0;
	let bestDist = Math.abs(top);
	let slotTop = 0;
	for (let j = 0; j < heights.length; j += 1) {
		slotTop += heights[j];
		const dist = Math.abs(top - slotTop);
		if (dist < bestDist) {
			best = j + 1;
			bestDist = dist;
		}
	}
	return best;
}

/**
 * Auto-scroll velocity for a pointer at `y` inside a box spanning
 * `top`..`bottom`: negative near the top edge, positive near the bottom,
 * scaled by how deep into the `zone` the pointer is.
 *
 * @param {number} y
 * @param {number} top
 * @param {number} bottom
 * @param {number} [zone]
 * @param {number} [max] px per frame
 * @returns {number}
 */
export function edgeScroll(y, top, bottom, zone = 40, max = 12) {
	if (bottom - top <= zone * 2) return 0;
	if (y < top + zone) return -Math.ceil(max * Math.min(1, (top + zone - y) / zone));
	if (y > bottom - zone) return Math.ceil(max * Math.min(1, (y - (bottom - zone)) / zone));
	return 0;
}
