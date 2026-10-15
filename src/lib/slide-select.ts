// Press-and-slide picking: press a trigger, drag over a target to arm it,
// release to fire it. The caller owns opening and maps a pointer to a target.

export const SLIDE_THRESHOLD = 12;

export interface SlideMove {
	x: number;
	y: number;
	dx: number;
	dy: number;
}

export interface SlideOptions {
	/** Target index under the pointer, or -1. Not asked within `threshold` of the press. */
	pick: (move: SlideMove) => number;
	/** The armed target changed (-1: none). */
	onarm: (index: number) => void;
	threshold?: number;
}

export interface SlideSelect {
	/** Start tracking; captures the pointer on `el` so moves keep arriving over a top-layer panel. */
	down(e: PointerEvent, el?: Element | null): void;
	move(e: PointerEvent): void;
	/** Stop tracking; returns the armed index (or -1). */
	up(): number;
	cancel(): void;
	readonly active: boolean;
	/** True once the pointer travelled past the threshold since `down`. */
	readonly slid: boolean;
}

export function slideSelect({
	pick,
	onarm,
	threshold = SLIDE_THRESHOLD,
}: SlideOptions): SlideSelect {
	let origin: { x: number; y: number } | null = null;
	let armed = -1;
	let slid = false;
	const arm = (i: number) => {
		if (i === armed) return;
		armed = i;
		onarm(i);
	};
	const stop = () => {
		const i = armed;
		origin = null;
		arm(-1);
		return i;
	};
	return {
		down(e, el) {
			origin = { x: e.clientX, y: e.clientY };
			slid = false;
			arm(-1);
			try {
				el?.setPointerCapture(e.pointerId);
			} catch {}
		},
		move(e) {
			if (!origin) return;
			const dx = e.clientX - origin.x;
			const dy = e.clientY - origin.y;
			if (Math.hypot(dx, dy) < threshold) {
				arm(-1);
				return;
			}
			slid = true;
			arm(pick({ x: e.clientX, y: e.clientY, dx, dy }));
		},
		up: () => (origin ? stop() : -1),
		cancel() {
			stop();
		},
		get active() {
			return origin !== null;
		},
		get slid() {
			return slid;
		},
	};
}
