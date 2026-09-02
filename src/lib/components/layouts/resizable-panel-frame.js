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

/**
 * Resolve a width prop that is either a pixel number or a CSS length.
 * Plain `px` strings parse directly; anything else is handed to `measure`,
 * which lays the length out and returns its pixel size (or `undefined` when
 * there is no DOM to measure in).
 *
 * @param {number | string} value
 * @param {(css: string) => number | undefined} measure
 * @returns {number | undefined}
 */
export function resolveLength(value, measure) {
	if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
	const px = /^\s*(-?\d*\.?\d+)px\s*$/.exec(value);
	if (px) return Number(px[1]);
	const measured = measure(value);
	return measured !== undefined && Number.isFinite(measured) ? measured : undefined;
}

/**
 * @typedef {object} ResizeHandleParams
 * @property {'left' | 'right'} side Edge the resized box sits on; dragging away from it grows the box.
 * @property {(width: number) => void} onwidth Called once per animation frame while dragging and on every keyboard step.
 * @property {(width: number) => void} [oncommit] Called with the settled width on pointer release and after each keyboard step.
 * @property {() => void} [onreset] Double-click on the handle.
 * @property {(active: boolean) => void} [onactive] Drag start/end, for a `resizing` class.
 * @property {() => number} [measure] Current width in px; defaults to the handle's parent box.
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [step] Pixels per arrow key press (default 16).
 */

/**
 * Svelte action turning any element into a pointer + keyboard width grip.
 * One pointer-capture / rAF-coalesced implementation shared by
 * ResizablePanel and consumer-built grips.
 *
 * Usage: <div role="separator" tabindex="0" use:resizeHandle={{ side, min, max, onwidth }}></div>
 *
 * @param {HTMLElement} node
 * @param {ResizeHandleParams} params
 */
export function resizeHandle(node, params) {
	let current = params;
	let active = false;
	let startX = 0;
	let startWidth = 0;

	const frames = createFrameBatcher(
		(callback) => requestAnimationFrame(callback),
		(handle) => cancelAnimationFrame(handle),
		/** @param {number} width */
		(width) => current.onwidth(width),
	);

	/** @param {number} width */
	function clamp(width) {
		const min = current.min ?? 1;
		const max = current.max ?? Number.POSITIVE_INFINITY;
		return Math.round(Math.max(min, Math.min(width, Math.max(min, max))));
	}

	function direction() {
		return current.side === 'right' ? -1 : 1;
	}

	function measure() {
		if (current.measure) return current.measure();
		return node.parentElement?.getBoundingClientRect().width ?? 0;
	}

	/** @param {number} clientX */
	function widthAt(clientX) {
		return clamp(startWidth + (clientX - startX) * direction());
	}

	/** @param {PointerEvent} event */
	function down(event) {
		if (event.button !== 0) return;
		active = true;
		startX = event.clientX;
		startWidth = measure();
		node.setPointerCapture(event.pointerId);
		event.preventDefault();
		current.onactive?.(true);
	}

	/** @param {PointerEvent} event */
	function move(event) {
		if (!active) return;
		frames.schedule(widthAt(event.clientX));
	}

	/** @param {PointerEvent} event */
	function up(event) {
		if (!active) return;
		active = false;
		const width = widthAt(event.clientX);
		frames.flush(width);
		try {
			node.releasePointerCapture(event.pointerId);
		} catch {
			// Pointer capture may already have been released by the browser.
		}
		current.onactive?.(false);
		current.oncommit?.(width);
	}

	/** @param {KeyboardEvent} event */
	function keydown(event) {
		const step = current.step ?? 16;
		/** @type {number | undefined} */
		let next;
		switch (event.key) {
			case 'ArrowLeft':
				next = measure() - step * direction();
				break;
			case 'ArrowRight':
				next = measure() + step * direction();
				break;
			case 'Home':
				next = current.min;
				break;
			case 'End':
				next = current.max;
				break;
		}
		if (next === undefined) return;
		event.preventDefault();
		const width = clamp(next);
		current.onwidth(width);
		current.oncommit?.(width);
	}

	function reset() {
		current.onreset?.();
	}

	node.addEventListener('pointerdown', down);
	node.addEventListener('pointermove', move);
	node.addEventListener('pointerup', up);
	node.addEventListener('pointercancel', up);
	node.addEventListener('keydown', keydown);
	node.addEventListener('dblclick', reset);

	return {
		/** @param {ResizeHandleParams} next */
		update(next) {
			current = next;
		},
		destroy() {
			node.removeEventListener('pointerdown', down);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerup', up);
			node.removeEventListener('pointercancel', up);
			node.removeEventListener('keydown', keydown);
			node.removeEventListener('dblclick', reset);
			frames.discard();
		},
	};
}
