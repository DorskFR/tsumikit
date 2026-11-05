/**
 * The kit's breakpoint contract. Media queries in consumer apps should only use
 * these widths (min-width form) or their max-width complements (one unit below,
 * e.g. 39.999rem / 639px / 639.98px).
 */
export const BREAKPOINTS = [
	{ name: 'sm', rem: 40, px: 640 },
	{ name: 'md', rem: 48, px: 768 },
	{ name: 'lg', rem: 64, px: 1024 }
];

const LENGTH = /^(-?\d*\.?\d+)(px|rem|em)$/;

/**
 * True when a media-query width token (e.g. "640px", "47.999rem") is one of the
 * kit's breakpoints or a max-width complement of one. `em` in a media query
 * resolves against the root font size, so it is treated like `rem`.
 */
export function isAllowedBreakpointWidth(token) {
	const m = LENGTH.exec(token.trim());
	if (!m) return false;
	const value = Number(m[1]);
	const key = m[2] === 'px' ? 'px' : 'rem';
	return BREAKPOINTS.some((bp) => {
		const target = bp[key];
		return value === target || (value >= target - 1 && value < target);
	});
}

export function describeBreakpoints() {
	return BREAKPOINTS.map((bp) => `${bp.rem}rem/${bp.px}px`).join(', ');
}
