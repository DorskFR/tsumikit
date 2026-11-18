let region: HTMLElement | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Speak `message` through one shared, lazily created polite live region. */
export function announce(message: string, delay = 100): void {
	if (typeof document === 'undefined' || !message) return;
	if (!region?.isConnected) {
		region = document.createElement('div');
		region.dataset.tsu = 'Announcer';
		region.setAttribute('aria-live', 'polite');
		region.setAttribute('aria-atomic', 'true');
		Object.assign(region.style, {
			position: 'absolute',
			width: '1px',
			height: '1px',
			margin: '-1px',
			padding: '0',
			overflow: 'hidden',
			clipPath: 'inset(50%)',
			whiteSpace: 'nowrap',
			border: '0',
		});
		document.body.append(region);
	}
	const node = region;
	node.textContent = '';
	clearTimeout(timer);
	timer = setTimeout(() => {
		node.textContent = message;
	}, delay);
}
