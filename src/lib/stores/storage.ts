// localStorage throws SecurityError when site data is blocked (Safari private
// mode, sandboxed or third-party iframes); callers fall back to their defaults.
export function readStorage(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

export function writeStorage(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {}
}
