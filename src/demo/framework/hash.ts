/** Legacy showcase anchors → the first section that now covers them. */
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
};

export function resolveHash(hash: string): string {
	const id = hash.replace(/^#/, '');
	return LEGACY_IDS[id] ?? id;
}

/**
 * The browser resolves a deep link before hydration lays the sections out, so
 * re-aim once; a legacy id is rewritten in the URL first.
 */
export function aimAtHash(): void {
	const raw = location.hash.slice(1);
	if (!raw) return;
	const id = resolveHash(raw);
	if (id !== raw) history.replaceState(null, '', `#${id}`);
	requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
}
