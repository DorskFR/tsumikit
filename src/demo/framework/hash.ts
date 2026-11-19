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

/**
 * The page a `#hash` of the single-page showcase now lives on: the section's
 * route, keeping an example anchor. `undefined` for an unknown section.
 */
export function pageFor(
	hash: string,
	pathOf: (section: string) => string | undefined,
): string | undefined {
	const id = resolveHash(hash);
	const section = id.split('--')[0];
	const path = section ? pathOf(section) : undefined;
	if (!path) return undefined;
	return id === section ? path : `${path}#${id}`;
}
