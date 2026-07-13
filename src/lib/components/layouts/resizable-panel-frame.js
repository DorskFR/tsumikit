/**
 * Coalesce high-frequency values into one update per animation frame while
 * still allowing pointer release to synchronously apply the final value.
 *
 * @template T
 * @param {(callback: FrameRequestCallback) => number} requestFrame
 * @param {(handle: number) => void} cancelFrame
 * @param {(value: T) => void} apply
 */
export function createFrameBatcher(requestFrame, cancelFrame, apply) {
	/** @type {number | undefined} */
	let frame;
	/** @type {T | undefined} */
	let pending;
	let scheduled = false;
	let generation = 0;

	/** Apply the latest queued value, invalidating any stale frame callback. */
	function applyPending() {
		if (pending === undefined) return;
		const value = pending;
		pending = undefined;
		apply(value);
	}

	return {
		/** @param {T} value */
		schedule(value) {
			pending = value;
			if (scheduled) return;

			scheduled = true;
			const token = ++generation;
			frame = requestFrame(() => {
				if (!scheduled || token !== generation) return;
				scheduled = false;
				frame = undefined;
				applyPending();
			});
		},

		/** @param {T} value */
		flush(value) {
			pending = value;
			if (scheduled) {
				scheduled = false;
				generation += 1;
				if (frame !== undefined) cancelFrame(frame);
				frame = undefined;
			}
			applyPending();
		},

		discard() {
			pending = undefined;
			if (!scheduled) return;
			scheduled = false;
			generation += 1;
			if (frame !== undefined) cancelFrame(frame);
			frame = undefined;
		},
	};
}
