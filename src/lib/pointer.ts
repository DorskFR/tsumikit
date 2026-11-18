const POINTER_SURFACE = '.card-tap, .card.metric';

function write(el: HTMLElement, name: string, value: string) {
	if (el.style.getPropertyValue(name) !== value) el.style.setProperty(name, value);
}

/** Sets `--pointer-x` / `--pointer-y` (px, box-relative) on the hovered spotlight
 *  card (`.card-tap`, `.card.metric`) and its card ancestors, mouse only. */
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
		let el = (e.target as Element | null)?.closest?.<HTMLElement>(POINTER_SURFACE);
		while (el) {
			const r = el.getBoundingClientRect();
			write(el, '--pointer-x', `${e.clientX - r.left}px`);
			write(el, '--pointer-y', `${e.clientY - r.top}px`);
			el = el.parentElement?.closest<HTMLElement>(POINTER_SURFACE);
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
