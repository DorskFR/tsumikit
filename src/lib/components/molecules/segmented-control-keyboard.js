/**
 * Resolve a SegmentedControl navigation key to the next selectable option.
 * Arrow navigation wraps and skips disabled options; Home/End jump to the
 * first/last selectable option. Unhandled keys do not change selection.
 *
 * @param {{ disabled?: boolean }[]} options
 * @param {number} current
 * @param {string} key
 * @returns {number | undefined}
 */
export function nextEnabledSegment(options, current, key) {
	if (current < 0 || current >= options.length) return undefined;
	if (key === 'Home') {
		const first = options.findIndex((option) => !option.disabled);
		return first >= 0 ? first : current;
	}
	if (key === 'End') {
		const fromEnd = [...options].reverse().findIndex((option) => !option.disabled);
		return fromEnd >= 0 ? options.length - 1 - fromEnd : current;
	}

	let direction;
	if (key === 'ArrowRight' || key === 'ArrowDown') direction = 1;
	else if (key === 'ArrowLeft' || key === 'ArrowUp') direction = -1;
	else return undefined;

	for (let offset = 1; offset <= options.length; offset += 1) {
		const next =
			(((current + direction * offset) % options.length) + options.length) % options.length;
		if (!options[next].disabled) return next;
	}
	return current;
}
