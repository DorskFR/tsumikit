/**
 * Collapse whitespace runs so formatting cannot break a source-text assertion.
 * @param {string} src
 */
export function normalize(src) {
	return src.replace(/\s+/g, ' ');
}

/**
 * Declarations of the first CSS rule whose selector list matches `selector` exactly.
 * @param {string} src
 * @param {string} selector
 * @returns {Record<string, string>}
 */
export function rule(src, selector) {
	const re = new RegExp(`(?:^|[}\\n])\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{([^}]*)}`);
	const body = src.match(re)?.[1] ?? '';
	return Object.fromEntries(
		body
			.split(';')
			.map((/** @type {string} */ d) => d.trim())
			.filter(Boolean)
			.map((/** @type {string} */ d) => {
				const i = d.indexOf(':');
				return [d.slice(0, i).trim(), normalize(d.slice(i + 1)).trim()];
			})
	);
}

/**
 * True when `selector` declares `prop` (optionally matching `value`), in any order.
 * @param {string} src
 * @param {string} selector
 * @param {string} prop
 * @param {string | RegExp} [value]
 */
export function hasDecl(src, selector, prop, value) {
	const v = rule(src, selector)[prop];
	if (v === undefined) return false;
	return value === undefined ? true : value instanceof RegExp ? value.test(v) : v === value;
}
