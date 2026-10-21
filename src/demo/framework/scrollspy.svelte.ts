/**
 * Active section = the last one whose top has crossed the line under the
 * header. An IntersectionObserver band cannot do this: a section shorter than
 * the band never intersects it and the highlight sticks to a neighbour. The
 * page bottom owns the last section, which can never reach the line.
 */
export function createScrollspy(opts: {
	sections: () => HTMLElement[];
	line: () => number;
	/** Read inside the effect so a change re-runs the measurement. */
	deps?: () => unknown;
}) {
	let active = $state('');

	$effect(() => {
		opts.deps?.();
		let queued = false;
		const update = () => {
			queued = false;
			const sections = opts.sections();
			if (sections.length === 0) return;
			if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
				active = sections[sections.length - 1].id;
				return;
			}
			const line = opts.line();
			let current = sections[0].id;
			for (const el of sections) {
				if (el.getBoundingClientRect().top > line) break;
				current = el.id;
			}
			active = current;
		};
		const onscroll = () => {
			if (queued) return;
			queued = true;
			requestAnimationFrame(update);
		};
		update();
		addEventListener('scroll', onscroll, { passive: true });
		addEventListener('resize', onscroll);
		return () => {
			removeEventListener('scroll', onscroll);
			removeEventListener('resize', onscroll);
		};
	});

	return {
		get active() {
			return active;
		},
	};
}
