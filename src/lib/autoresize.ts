/**
 * Svelte action: grow a <textarea> with its content up to a max height, then
 * scroll. Pass the bound value so it re-measures on programmatic changes
 * (drafts loading, clearing, etc.).
 *
 * Usage: <textarea use:autoresize={value} ...></textarea>
 */
/** Height `rows` lines would occupy: line boxes plus vertical padding and borders. */
export function rowsFloor(node: HTMLTextAreaElement): number {
	const rows = node.rows || 0;
	if (rows <= 1) return 0;
	const cs = getComputedStyle(node);
	const fontSize = parseFloat(cs.fontSize) || 16;
	const lh = parseFloat(cs.lineHeight) || fontSize * 1.2;
	const box =
		(parseFloat(cs.paddingTop) || 0) +
		(parseFloat(cs.paddingBottom) || 0) +
		(parseFloat(cs.borderTopWidth) || 0) +
		(parseFloat(cs.borderBottomWidth) || 0);
	return rows * lh + box;
}

export function autoresize(node: HTMLTextAreaElement, _value?: string) {
	const resize = () => {
		// A manual drag handle may set `min-height` as a user-chosen floor; grow
		// with content but never collapse below it. Content always wins the lower
		// bound, so dragging shorter than the text can't shrink past it.
		const floor = Math.max(parseFloat(node.style.minHeight) || 0, rowsFloor(node));
		node.style.height = 'auto';
		node.style.height = `${Math.max(node.scrollHeight, floor)}px`;
	};
	resize();
	node.addEventListener('input', resize);
	return {
		update() {
			// re-measure when the bound value changes from outside (e.g. cleared)
			resize();
		},
		destroy() {
			node.removeEventListener('input', resize);
		},
	};
}
