// Shared placement for top-layer floating elements (Popover panel, Tooltip).
// Both render in the browser top layer (via the Popover API), so they escape
// ancestor `overflow`/`transform`/`contain` clipping; this just positions them
// against their trigger as `position: fixed` coordinates, flipping to the other
// side and clamping into the viewport so they never run off-screen.

export type Side = 'top' | 'bottom';
export type Align = 'start' | 'center' | 'end';
/** `${side}-${align}`, e.g. `bottom-start` (Popover) or `top-center` (Tooltip). */
export type Placement = `${Side}-${Align}`;

/**
 * Position `floating` next to `trigger` and write the result to its inline
 * `top`/`left` (expects `floating` to be `position: fixed`). Call on open and on
 * scroll/resize while open.
 */
export function place(
	trigger: HTMLElement,
	floating: HTMLElement,
	placement: Placement = 'bottom-start',
	gap = 6,
): void {
	const t = trigger.getBoundingClientRect();
	const f = floating.getBoundingClientRect();
	const vw = document.documentElement.clientWidth;
	const vh = document.documentElement.clientHeight;
	const [side, align] = placement.split('-') as [Side, Align];

	// Vertical: preferred side, then flip to the other side if it overflows and
	// the opposite side has room; finally clamp so it always stays on screen.
	let top = side === 'bottom' ? t.bottom + gap : t.top - f.height - gap;
	if (side === 'bottom' && top + f.height > vh && t.top - f.height - gap >= 0) {
		top = t.top - f.height - gap;
	} else if (side === 'top' && top < 0 && t.bottom + f.height + gap <= vh) {
		top = t.bottom + gap;
	}
	top = Math.max(gap, Math.min(top, vh - f.height - gap));

	// Horizontal: align to the trigger's start/center/end, then clamp.
	let left =
		align === 'start'
			? t.left
			: align === 'end'
				? t.right - f.width
				: t.left + t.width / 2 - f.width / 2;
	left = Math.max(gap, Math.min(left, vw - f.width - gap));

	floating.style.top = `${Math.round(top)}px`;
	floating.style.left = `${Math.round(left)}px`;
}
