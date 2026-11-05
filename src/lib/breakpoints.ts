/**
 * The kit's breakpoint contract, in rem so zoom and large-text settings move the
 * switch points with the type. Must match lint/breakpoints.mjs and every
 * width `@media` in src/lib.
 */
export const breakpoints = { sm: 40, md: 48, lg: 64 } as const;

export type Breakpoint = keyof typeof breakpoints;

export const breakpointsPx: Record<Breakpoint, number> = { sm: 640, md: 768, lg: 1024 };

export function minWidth(bp: Breakpoint): string {
	return `(min-width: ${breakpoints[bp]}rem)`;
}

/** 0.001rem below `minWidth` so the two never both match at the edge. */
export function maxWidth(bp: Breakpoint): string {
	return `(max-width: ${(breakpoints[bp] - 0.001).toFixed(3)}rem)`;
}
