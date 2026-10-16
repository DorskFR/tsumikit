const countFormat = new Intl.NumberFormat('en-US');

/** @param {number | string} count */
export function formatSegmentCount(count) {
	return typeof count === 'number' ? countFormat.format(count) : count;
}
