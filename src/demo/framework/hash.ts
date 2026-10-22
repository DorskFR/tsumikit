/** Anchors of the former single-page showcase → the first section that now covers them. */
export const LEGACY_IDS: Record<string, string> = {
	'layout-primitives': 'stack',
	'form-atoms': 'input',
	'checkbox-radio': 'checkbox',
	'file-dropzone': 'file-button',
	navbar: 'nav-bar',
	'player-sliders': 'seek-slider',
	conversation: 'conversation-panel',
	toasts: 'toaster',
	'popover-menu': 'popover',
	'g-foundations': 'typography',
	'g-forms': 'input',
	'g-data': 'badge',
	'g-feedback': 'empty-state',
	'g-layout': 'stack',
	'g-navigation': 'tabs',
	'g-overlays': 'popover',
	'g-actions': 'button',
};

export function resolveHash(hash: string): string {
	const id = hash.replace(/^#/, '');
	return LEGACY_IDS[id] ?? id;
}

export function sectionOf(hash: string): string {
	return resolveHash(hash).split('--')[0];
}

let stopAim: (() => void) | null = null;

export function aiming(): boolean {
	return stopAim !== null;
}

/**
 * `content-visibility` placeholders around the target resize as they render
 * (WebKit has no scroll anchoring) and mounts can scroll the page, so re-aim
 * every frame until the target holds still for `settleMs` of frame time or the
 * user takes over. Frame time, not timers: a busy main thread delays both.
 */
export function aim(id: string, settleMs = 1500, maxMs = 8000): void {
	stopAim?.();
	let want = Number.NaN;
	let first = 0;
	let fixed = 0;
	let frame = 0;
	const loop = (now: number) => {
		const el = document.getElementById(id);
		if (!el) return stop();
		first ||= now;
		if (!(Math.abs(el.getBoundingClientRect().top - want) <= 1)) {
			el.scrollIntoView();
			want = el.getBoundingClientRect().top;
			fixed = now;
		}
		if (now - fixed >= settleMs || now - first >= maxMs) return stop();
		frame = requestAnimationFrame(loop);
	};
	const inputs = ['pointerdown', 'touchstart', 'keydown', 'wheel'] as const;
	const stop = () => {
		cancelAnimationFrame(frame);
		for (const e of inputs) removeEventListener(e, stop, true);
		if (stopAim === stop) stopAim = null;
	};
	stopAim = stop;
	for (const e of inputs) addEventListener(e, stop, { capture: true, passive: true });
	frame = requestAnimationFrame(loop);
}

/** Former anchors are rewritten in the URL first; `reach` runs before aiming. */
export function aimAtHash(reach: (id: string) => void = () => {}): void {
	const raw = location.hash.slice(1);
	if (!raw) return;
	const id = resolveHash(raw);
	if (id !== raw) history.replaceState(null, '', `#${id}`);
	reach(id);
	aim(id);
}

/**
 * Every in-page navigation (link click, including the current hash and former
 * anchors, back/forward, an edited URL) lands through `aim`.
 */
export function followHashes(reach: (id: string) => void = () => {}): () => void {
	const onclick = (e: MouseEvent) => {
		if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
			return;
		const a =
			e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
		const raw = a?.getAttribute('href')?.slice(1);
		if (!raw) return;
		const id = resolveHash(raw);
		if (!document.getElementById(id)) return;
		e.preventDefault();
		if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
		reach(id);
		aim(id);
	};
	const onhash = () => aimAtHash(reach);
	addEventListener('click', onclick);
	addEventListener('hashchange', onhash);
	return () => {
		removeEventListener('click', onclick);
		removeEventListener('hashchange', onhash);
	};
}
