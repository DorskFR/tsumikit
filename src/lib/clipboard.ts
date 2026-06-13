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
	try {
		const ta = document.createElement('textarea');
		ta.value = value;
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.appendChild(ta);
		ta.select();
		const ok = document.execCommand('copy');
		document.body.removeChild(ta);
		return ok;
	} catch {
		return false;
	}
}
