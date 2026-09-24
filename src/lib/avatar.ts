import { artworkHue } from './artwork';

/** First grapheme of `name` (so emoji, flags and combining marks stay whole),
 *  upper-cased. Blank input yields ''. */
export function avatarInitial(name: string): string {
	const trimmed = name.trim();
	if (!trimmed) return '';
	const first =
		typeof Intl !== 'undefined' && 'Segmenter' in Intl
			? [...new Intl.Segmenter().segment(trimmed)][0]?.segment
			: [...trimmed][0];
	return (first ?? '').toUpperCase();
}

/** Hue (0–359) for `seed`; the same hash as `artworkHue`, so an Artwork
 *  fallback and an Avatar for one name agree on their tint. */
export function avatarHue(seed: string): number {
	return artworkHue(seed);
}
