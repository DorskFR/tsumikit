/**
 * Replace a jsdom window's timers with a manual clock, so busy windows can be
 * stepped exactly. Call before evaluating the bundle.
 * @param {import('jsdom').DOMWindow} win
 */
export function installFakeClock(win) {
	/** @type {Map<number, { fn: () => void, at: number }>} */
	const timers = new Map();
	let id = 0;
	let now = 0;
	win.setTimeout = /** @type {any} */ (
		(/** @type {() => void} */ fn, /** @type {number} */ ms = 0) => {
			timers.set(++id, { fn, at: now + ms });
			return id;
		}
	);
	win.clearTimeout = /** @type {any} */ ((/** @type {number} */ handle) => void timers.delete(handle));
	win.Date.now = () => now;
	return {
		get now() {
			return now;
		},
		/** @param {number} ms */
		advance(ms) {
			const target = now + ms;
			for (;;) {
				const next = [...timers.entries()].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
				if (!next) break;
				now = next[1].at;
				timers.delete(next[0]);
				next[1].fn();
			}
			now = target;
		},
		pending: () => timers.size
	};
}
