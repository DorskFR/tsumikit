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

/** Viewport-relative box to float against: an element's rect or a virtual one (a text caret). */
export type AnchorRect = Pick<DOMRect, 'top' | 'left' | 'bottom' | 'right' | 'width' | 'height'>;

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
	placeAt(trigger.getBoundingClientRect(), floating, placement, gap);
}

/** `place` against a viewport rect instead of an element. */
export function placeAt(
	t: AnchorRect,
	floating: HTMLElement,
	placement: Placement = 'bottom-start',
	gap = 6,
): void {
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

	const resolved: Side =
		side === 'top' || side === 'bottom'
			? top + f.height / 2 < t.top + t.height / 2
				? 'top'
				: 'bottom'
			: left + f.width / 2 < t.left + t.width / 2
				? 'left'
				: 'right';
	const cx = Math.round(clamp(t.left + t.width / 2 - left, 0, f.width));
	const cy = Math.round(clamp(t.top + t.height / 2 - top, 0, f.height));
	floating.dataset.side = resolved;
	floating.style.setProperty('--tsu-origin', ORIGIN[resolved](cx, cy));
	floating.style.setProperty('--tsu-shift', SHIFT[resolved]);
}

// Enter motion grows out of the trigger: the origin sits on the trigger-facing
// edge, level with the trigger centre, and the panel starts shifted towards it.
const ORIGIN: Record<Side, (cx: number, cy: number) => string> = {
	top: (cx) => `${cx}px 100%`,
	bottom: (cx) => `${cx}px 0`,
	left: (_cx, cy) => `100% ${cy}px`,
	right: (_cx, cy) => `0 ${cy}px`,
};
const SHIFT: Record<Side, string> = {
	top: '0 var(--shift-sm)',
	bottom: '0 calc(-1 * var(--shift-sm))',
	left: 'var(--shift-sm) 0',
	right: 'calc(-1 * var(--shift-sm)) 0',
};

/** Viewport edges (px) that a floating layout must stay inside. */
export interface Bounds {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export interface Point {
	x: number;
	y: number;
}

export interface FanInput {
	/** Centre of the trigger, in viewport px. */
	center: Point;
	count: number;
	/** Degrees, 0 = right, counter-clockwise. */
	from: number;
	to: number;
	/** Preferred distance from `center` to each petal centre. */
	radius: number;
	/** Petal diameter. */
	petal: number;
	/** Smallest radius the fan may shrink to before it is shifted instead. */
	minRadius?: number;
	bounds: Bounds;
}

export interface FanLayout {
	radius: number;
	/** Petal centres, in `count` order. */
	points: Point[];
}

/** Angles (degrees) of `count` petals spread evenly from `from` to `to`. */
export function fanAngles(count: number, from: number, to: number): number[] {
	if (count <= 1) return count === 1 ? [(from + to) / 2] : [];
	return Array.from({ length: count }, (_, i) => from + ((to - from) * i) / (count - 1));
}

/**
 * Lay `count` petals on an arc around `center`, shrinking the radius until every
 * petal fits in `bounds`; if even `minRadius` overflows, the whole fan shifts in.
 */
export function fanLayout({
	center,
	count,
	from,
	to,
	radius,
	petal,
	minRadius = 0,
	bounds,
}: FanInput): FanLayout {
	const half = petal / 2;
	const lo = { x: bounds.left + half, y: bounds.top + half };
	const hi = { x: bounds.right - half, y: bounds.bottom - half };
	const units = fanAngles(count, from, to).map((deg) => {
		const rad = (deg * Math.PI) / 180;
		return { x: Math.cos(rad), y: -Math.sin(rad) };
	});
	const reach = (c: number, u: number, min: number, max: number) =>
		u > 1e-9 ? (max - c) / u : u < -1e-9 ? (min - c) / u : Number.POSITIVE_INFINITY;
	let r = radius;
	for (const u of units) {
		r = Math.min(r, reach(center.x, u.x, lo.x, hi.x), reach(center.y, u.y, lo.y, hi.y));
	}
	r = Math.max(r, Math.min(minRadius, radius));
	const raw = units.map((u) => ({ x: center.x + u.x * r, y: center.y + u.y * r }));
	const shift = (vals: number[], min: number, max: number) => {
		if (!vals.length) return 0;
		const a = Math.min(...vals);
		const b = Math.max(...vals);
		if (b - a > max - min) return (min + max) / 2 - (a + b) / 2;
		return a < min ? min - a : b > max ? max - b : 0;
	};
	const dx = shift(
		raw.map((p) => p.x),
		lo.x,
		hi.x,
	);
	const dy = shift(
		raw.map((p) => p.y),
		lo.y,
		hi.y,
	);
	return { radius: r, points: raw.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
}
