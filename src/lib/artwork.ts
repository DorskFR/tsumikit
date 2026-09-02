// Placeholder look for missing artwork: a deterministic hue from `seed` so the
// same album/show always gets the same tint, tinted over the surface tokens so
// the fallback tracks the active theme instead of being a fixed dark gradient.

function hash(text: string): number {
	let h = 0;
	for (const ch of text) {
		h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
	}
	return h;
}

/** Hue (0–359) derived from `seed`; stable across runs and environments. */
export function artworkHue(seed: string): number {
	return hash(seed) % 360;
}

/** CSS `linear-gradient(...)` for the artwork fallback, keyed on `seed`. */
export function artworkGradient(seed: string): string {
	const h = artworkHue(seed);
	return `linear-gradient(160deg, color-mix(in srgb, hsl(${h} 60% 55%) 28%, var(--bg-elevated-2)), color-mix(in srgb, hsl(${h} 60% 40%) 16%, var(--bg-elevated)))`;
}

/** Up to two uppercase initials: first letters of the first two words, or the
 *  first two characters of a single word. Empty input yields ''. */
export function initials(text: string): string {
	const words = text.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return '';
	const picked =
		words.length === 1 ? [...words[0]].slice(0, 2) : words.slice(0, 2).map((w) => [...w][0]);
	return picked.join('').toUpperCase();
}
