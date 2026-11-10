export function selectedIds(value: string | string[] | undefined): string[] {
	if (value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}

export function toggleId(ids: string[], id: string): string[] {
	return ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id];
}

/** Which inline edges of a horizontal scroller hide content (`scrollLeft` is negative in RTL). */
export function fadeEdges(
	scrollLeft: number,
	scrollWidth: number,
	clientWidth: number,
): { start: boolean; end: boolean } {
	const offset = Math.abs(scrollLeft);
	return { start: offset > 1, end: scrollWidth - clientWidth - offset > 1 };
}

/** Horizontal scroll delta that brings `chip` inside `list`, `pad` clear of either edge. */
export function revealDelta(
	list: { left: number; right: number },
	chip: { left: number; right: number },
	pad = 0,
): number {
	if (chip.left < list.left + pad) return chip.left - list.left - pad;
	if (chip.right > list.right - pad) return chip.right - list.right + pad;
	return 0;
}
