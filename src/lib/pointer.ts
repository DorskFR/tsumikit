/** Sets `--pointer-x` / `--pointer-y` (px, box-relative) on the hovered
 *  `[data-tsu]` element and its `[data-tsu]` ancestors, mouse only. */
export function trackPointer(doc: Document | undefined = globalThis.document): () => void {
	if (!doc) return () => {};
	const win = doc.defaultView;
	let last: PointerEvent | null = null;
	let frame = 0;
	const flush = () => {
		frame = 0;
		const e = last;
		last = null;
		if (!e) return;
		let el = (e.target as Element | null)?.closest?.<HTMLElement>('[data-tsu]');
		while (el) {
			const r = el.getBoundingClientRect();
			el.style.setProperty('--pointer-x', `${e.clientX - r.left}px`);
			el.style.setProperty('--pointer-y', `${e.clientY - r.top}px`);
			el = el.parentElement?.closest<HTMLElement>('[data-tsu]');
		}
	};
	const move = (e: PointerEvent) => {
		if (e.pointerType !== 'mouse') return;
		last = e;
		if (!win) flush();
		else if (!frame) frame = win.requestAnimationFrame(flush);
	};
	doc.addEventListener('pointermove', move, { passive: true });
	return () => {
		doc.removeEventListener('pointermove', move);
		if (frame) win?.cancelAnimationFrame(frame);
		frame = 0;
		last = null;
	};
}
