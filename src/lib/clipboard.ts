// Copy `value` to the clipboard. Prefers the async Clipboard API and falls back
// to a hidden-textarea + execCommand for insecure contexts / older browsers.
// Returns whether the copy succeeded; never throws. UI concerns (toasts, a
// transient "copied" state) belong to the caller.
export async function copyToClipboard(value: string): Promise<boolean> {
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(value);
			return true;
		}
	} catch {
		/* fall through to legacy path */
	}
	// Fallback for insecure contexts / older browsers.
	const prev = document.activeElement as HTMLElement | null;
	const sel = document.getSelection();
	const ranges = sel
		? Array.from({ length: sel.rangeCount }, (_, i) => sel.getRangeAt(i).cloneRange())
		: [];
	try {
		const ta = document.createElement('textarea');
		ta.value = value;
		ta.setAttribute('readonly', '');
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.appendChild(ta);
		ta.select();
		const ok = document.execCommand('copy');
		document.body.removeChild(ta);
		prev?.focus?.({ preventScroll: true });
		if (sel && ranges.length) {
			sel.removeAllRanges();
			for (const r of ranges) sel.addRange(r);
		}
		return ok;
	} catch {
		return false;
	}
}
