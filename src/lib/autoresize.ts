/**
 * Svelte action: grow a <textarea> with its content up to a max height, then
 * scroll. Pass the bound value so it re-measures on programmatic changes
 * (drafts loading, clearing, etc.).
 *
 * Usage: <textarea use:autoresize={value} ...></textarea>
 */
export function autoresize(node: HTMLTextAreaElement, _value?: string) {
	const resize = () => {
		// A manual drag handle may set `min-height` as a user-chosen floor; grow
		// with content but never collapse below it. Content always wins the lower
		// bound, so dragging shorter than the text can't shrink past it.
		const floor = parseFloat(node.style.minHeight) || 0;
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
