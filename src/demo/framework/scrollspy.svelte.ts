/**
 * Active section = the last one whose top has crossed the line under the
 * header. An IntersectionObserver band cannot do this: a section shorter than
 * the band never intersects it and the highlight sticks to a neighbour. The
 * page bottom owns the last section, which can never reach the line.
 */
export function createScrollspy(opts: {
	sections: () => HTMLElement[];
	line: () => number;
	/** A change re-reads `sections`; only a different list re-measures. */
	deps?: () => unknown;
}) {
	let active = $state('');
	let els: HTMLElement[] = [];
	let tops: number[] = [];
	let line = 0;
	let viewport = 0;
	let pageHeight = 0;
	let stale = true;
	let queued = false;
	let observer: ResizeObserver | undefined;
	const observed = new Set<Element>();

	const measure = () => {
		const y = window.scrollY;
		tops = els.map((el) => el.getBoundingClientRect().top + y);
		line = opts.line();
		viewport = window.innerHeight;
		pageHeight = document.documentElement.scrollHeight;
		stale = false;
	};

	const update = () => {
		queued = false;
		if (els.length === 0) return;
		if (stale) measure();
		const y = window.scrollY;
		if (viewport + y >= pageHeight - 2) {
			active = els[els.length - 1].id;
			return;
		}
		const target = y + line;
		let lo = 0;
		let hi = tops.length - 1;
		let current = 0;
		while (lo <= hi) {
			const mid = (lo + hi) >> 1;
			if (tops[mid] <= target) {
				current = mid;
				lo = mid + 1;
			} else hi = mid - 1;
		}
		active = els[current].id;
	};

	const schedule = () => {
		if (queued) return;
		queued = true;
		requestAnimationFrame(update);
	};

	const invalidate = () => {
		stale = true;
		schedule();
	};

	const track = (next: HTMLElement[]) => {
		if (!observer) return;
		const keep = new Set<Element>([document.documentElement, ...next]);
		for (const el of observed) if (!keep.has(el)) observer.unobserve(el);
		for (const el of keep) if (!observed.has(el)) observer.observe(el);
		observed.clear();
		for (const el of keep) observed.add(el);
	};

	$effect(() => {
		if (typeof ResizeObserver !== 'undefined') observer = new ResizeObserver(invalidate);
		addEventListener('scroll', schedule, { passive: true });
		addEventListener('resize', invalidate);
		return () => {
			observer?.disconnect();
			observer = undefined;
			observed.clear();
			removeEventListener('scroll', schedule);
			removeEventListener('resize', invalidate);
		};
	});

	$effect(() => {
		opts.deps?.();
		const next = opts.sections();
		if (next.length === els.length && next.every((el, i) => el === els[i])) return;
		els = next;
		track(next);
		stale = true;
		update();
	});

	return {
		get active() {
			return active;
		},
	};
}
