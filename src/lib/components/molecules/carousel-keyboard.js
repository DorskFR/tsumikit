/**
 * Clamp a slide index into `[0, count)`, wrapping when `loop` is set.
 *
 * @param {number} index
 * @param {number} count
 * @param {boolean} [loop]
 * @returns {number}
 */
export function clampSlide(index, count, loop = false) {
	if (count <= 0 || !Number.isFinite(index)) return 0;
	if (loop) return ((Math.trunc(index) % count) + count) % count;
	return Math.min(Math.max(Math.trunc(index), 0), count - 1);
}

/**
 * Step from `current` by `delta` slides. Without `loop` the edges absorb the
 * step, so stepping past the last slide stays on it.
 *
 * @param {number} current
 * @param {number} count
 * @param {number} delta
 * @param {boolean} [loop]
 * @returns {number}
 */
export function stepSlide(current, count, delta, loop = false) {
	return clampSlide(current + delta, count, loop);
}

/**
 * Resolve a Carousel navigation key to the slide it selects. Left/Right step by
 * one (wrapping only with `loop`), Home/End jump to the first/last slide.
 * Unhandled keys return `undefined` so the browser keeps its default.
 *
 * @param {number} current
 * @param {number} count
 * @param {string} key
 * @param {boolean} [loop]
 * @returns {number | undefined}
 */
export function nextSlideForKey(current, count, key, loop = false) {
	if (count <= 0) return undefined;
	if (key === 'ArrowRight') return stepSlide(current, count, 1, loop);
	if (key === 'ArrowLeft') return stepSlide(current, count, -1, loop);
	if (key === 'Home') return 0;
	if (key === 'End') return count - 1;
	return undefined;
}

/**
 * Interpret a completed pointer gesture as a slide step. A gesture counts as a
 * horizontal swipe only when it travels at least `threshold` px on the x axis
 * and further on x than on y; anything else is left to the page (vertical
 * scroll, taps). Swiping left reveals the next slide, so the result is +1.
 *
 * @param {number} dx
 * @param {number} dy
 * @param {number} [threshold]
 * @returns {-1 | 0 | 1}
 */
export function swipeStep(dx, dy, threshold = 40) {
	if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) return 0;
	return dx < 0 ? 1 : -1;
}
