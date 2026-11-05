import { untrack } from 'svelte';

/** Default show delay (ms): work that finishes sooner never shows an indicator. */
export const PENDING_DELAY_MS = 200;
/** Default minimum visible time (ms) once an indicator has appeared. */
export const PENDING_MIN_MS = 500;

export interface PendingOptions {
	/** Wait this long before showing; 0 shows at once. */
	delay?: number;
	/** Once shown, stay visible at least this long; 0 hides at once. */
	min?: number;
}

export interface Pending {
	/** The calmed indicator state: delayed in, held out. */
	readonly visible: boolean;
}

/** Call during component init; keep `aria-busy` on the real flag, only the visual is calmed. */
export function pending(
	busy: () => boolean,
	opts: PendingOptions | (() => PendingOptions) = {},
): Pending {
	if (typeof document === 'undefined') return { visible: false };
	const options = () => (typeof opts === 'function' ? opts() : opts);
	const delay = () => Math.max(0, options().delay ?? PENDING_DELAY_MS);
	const min = () => Math.max(0, options().min ?? PENDING_MIN_MS);
	let visible = $state(false);
	let showTimer: ReturnType<typeof setTimeout> | undefined;
	let minTimer: ReturnType<typeof setTimeout> | undefined;
	let holding = false;
	let hideWhenReleased = false;

	const clearShow = () => {
		if (showTimer !== undefined) clearTimeout(showTimer);
		showTimer = undefined;
	};
	const show = () => {
		showTimer = undefined;
		visible = true;
		const hold = min();
		if (hold > 0) {
			holding = true;
			minTimer = setTimeout(() => {
				holding = false;
				minTimer = undefined;
				if (hideWhenReleased) {
					hideWhenReleased = false;
					visible = false;
				}
			}, hold);
		}
	};
	const start = () => {
		if (visible) {
			hideWhenReleased = false;
			return;
		}
		if (showTimer !== undefined) return;
		const wait = delay();
		if (wait === 0) show();
		else showTimer = setTimeout(show, wait);
	};
	const stop = () => {
		clearShow();
		if (!visible) return;
		if (holding) hideWhenReleased = true;
		else visible = false;
	};

	$effect(() => {
		const on = busy();
		untrack(() => (on ? start() : stop()));
	});
	$effect(() => () => {
		clearShow();
		if (minTimer !== undefined) clearTimeout(minTimer);
	});

	return {
		get visible() {
			return visible;
		},
	};
}
