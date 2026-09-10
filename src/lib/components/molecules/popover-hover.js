// Hover-open intent for Popover: fine pointers only (a touch "pointerenter"
// fires on tap and would fight the click), with a delay before opening and a
// grace period before closing so the pointer can travel trigger -> panel.

export const HOVER_OPEN_DELAY = 150;
export const HOVER_CLOSE_GRACE = 120;

const FINE_POINTERS = new Set(['mouse', 'pen']);

/**
 * @param {'click' | 'hover'} openOn
 * @param {string | undefined} pointerType
 */
export function opensOnHover(openOn, pointerType) {
	return openOn === 'hover' && FINE_POINTERS.has(pointerType ?? '');
}

/**
 * @param {object} o
 * @param {() => void} o.open
 * @param {() => void} o.close
 * @param {(fn: () => void, ms: number) => any} [o.schedule]
 * @param {(handle: any) => void} [o.cancel]
 */
export function createHoverIntent({ open, close, schedule = setTimeout, cancel = clearTimeout }) {
	/** @type {any} */
	let timer = null;

	function clear() {
		if (timer !== null) {
			cancel(timer);
			timer = null;
		}
	}

	/**
	 * @param {() => void} fn
	 * @param {number} ms
	 */
	function later(fn, ms) {
		clear();
		timer = schedule(() => {
			timer = null;
			fn();
		}, ms);
	}

	return {
		/** @param {number} [delay] */
		enter(delay = HOVER_OPEN_DELAY) {
			later(open, Math.max(0, delay));
		},
		/** @param {number} [grace] */
		leave(grace = HOVER_CLOSE_GRACE) {
			later(close, Math.max(0, grace));
		},
		cancel: clear,
		get pending() {
			return timer !== null;
		},
	};
}
