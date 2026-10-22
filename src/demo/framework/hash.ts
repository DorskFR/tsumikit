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

/**
 * The browser resolves a deep link before hydration lays the sections out, and
 * `content-visibility` placeholders above the target resize as they render
 * (WebKit has no scroll anchoring), so keep the target aimed until layout
 * settles or the user takes over. A former anchor is rewritten in the URL first.
 */
export function aimAtHash(settleMs = 2000): void {
	const raw = location.hash.slice(1);
	if (!raw) return;
	const id = resolveHash(raw);
	if (id !== raw) history.replaceState(null, '', `#${id}`);
	let aimedY = Number.NaN;
	const aim = () => {
		document.getElementById(id)?.scrollIntoView();
		aimedY = scrollY;
	};
	requestAnimationFrame(aim);
	if (typeof ResizeObserver === 'undefined') return;
	const ro = new ResizeObserver(() =>
		requestAnimationFrame(() => {
			if (Math.abs(scrollY - aimedY) > 1) stop();
			else aim();
		}),
	);
	const inputs = ['pointerdown', 'touchstart', 'keydown', 'wheel'] as const;
	const stop = () => {
		ro.disconnect();
		clearTimeout(timer);
		for (const e of inputs) removeEventListener(e, stop, true);
	};
	const timer = setTimeout(stop, settleMs);
	for (const e of inputs) addEventListener(e, stop, { capture: true, passive: true });
	ro.observe(document.body);
}
