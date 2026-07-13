/**
 * Parse a persisted panel width without treating a missing or blank value as zero.
 * @param {string | null} value
 * @param {number} minWidth
 * @param {number} maxWidth
 * @returns {number | undefined}
 */
export function parseStoredWidth(value, minWidth, maxWidth) {
	if (value === null || value.trim() === '') return undefined;

	const width = Number(value);
	return Number.isFinite(width) ? Math.max(minWidth, Math.min(width, maxWidth)) : undefined;
}

/**
 * Only values written by the panel itself may restore its collapsed state.
 * @param {string | null} value
 * @returns {boolean | undefined}
 */
export function parseStoredCollapsed(value) {
	if (value === 'true') return true;
	if (value === 'false') return false;
	return undefined;
}
