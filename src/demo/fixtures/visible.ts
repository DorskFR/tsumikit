import type { Attachment } from 'svelte/attachments';

/**
 * Runs `tick` every `ms` while the node is on screen and the tab is visible
 * (always on screen without IntersectionObserver).
 * `active` is read reactively: the timer stops when it turns false.
 */
export function visibleInterval(
	tick: () => void,
	ms: number,
	active: () => boolean = () => true,
): Attachment {
	return (node) => {
		if (!active()) return;
		let seen = false;
		let id: ReturnType<typeof setInterval> | undefined;
		const sync = () => {
			const run = seen && !document.hidden;
			if (run && id === undefined) id = setInterval(tick, ms);
			else if (!run && id !== undefined) {
				clearInterval(id);
				id = undefined;
			}
		};
		const io =
			typeof IntersectionObserver === 'undefined'
				? undefined
				: new IntersectionObserver((records) => {
						seen = records[records.length - 1].isIntersecting;
						sync();
					});
		if (io) io.observe(node);
		else {
			seen = true;
			sync();
		}
		document.addEventListener('visibilitychange', sync);
		return () => {
			io?.disconnect();
			document.removeEventListener('visibilitychange', sync);
			seen = false;
			sync();
		};
	};
}
