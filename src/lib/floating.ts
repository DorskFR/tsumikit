// Shared placement for top-layer floating elements (Popover panel, Tooltip).
// Both render in the browser top layer (via the Popover API), so they escape
// ancestor `overflow`/`transform`/`contain` clipping; this just positions them
// against their trigger as `position: fixed` coordinates, flipping to the other
// side and clamping into the viewport so they never run off-screen.

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'start' | 'center' | 'end';
/** `${side}-${align}`, e.g. `bottom-start` (Popover) or `left-center` (Tooltip). */
export type Placement = `${Side}-${Align}`;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

// Position along the cross axis (start/center/end of the trigger's extent).
function alignPos(align: Align, start: number, size: number, fSize: number): number {
	if (align === 'start') return start;
	if (align === 'end') return start + size - fSize;
	return start + size / 2 - fSize / 2;
}

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

	let top: number;
	let left: number;

	if (side === 'top' || side === 'bottom') {
		// Vertical side; align along x. Preferred side, flip if it overflows and the
		// opposite side has room.
		top = side === 'bottom' ? t.bottom + gap : t.top - f.height - gap;
		if (side === 'bottom' && top + f.height > vh && t.top - f.height - gap >= 0) {
			top = t.top - f.height - gap;
		} else if (side === 'top' && top < 0 && t.bottom + f.height + gap <= vh) {
			top = t.bottom + gap;
		}
		left = alignPos(align, t.left, t.width, f.width);
	} else {
		// Horizontal side; align along y.
		left = side === 'right' ? t.right + gap : t.left - f.width - gap;
		if (side === 'right' && left + f.width > vw && t.left - f.width - gap >= 0) {
			left = t.left - f.width - gap;
		} else if (side === 'left' && left < 0 && t.right + f.width + gap <= vw) {
			left = t.right + gap;
		}
		top = alignPos(align, t.top, t.height, f.height);
	}

	// Clamp both axes so it always stays on screen.
	top = clamp(top, gap, vh - f.height - gap);
	left = clamp(left, gap, vw - f.width - gap);

	floating.style.top = `${Math.round(top)}px`;
	floating.style.left = `${Math.round(left)}px`;
}
