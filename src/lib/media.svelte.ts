import { MediaQuery } from 'svelte/reactivity';
import { type Breakpoint, breakpoints, minWidth } from './breakpoints';

export interface Media {
	/** Reactive inside effects and templates; `false` during SSR. */
	readonly matches: boolean;
}

const cache = new Map<string, Media>();

export function media(query: string): Media {
	let m = cache.get(query);
	if (!m) {
		if (typeof window === 'undefined') {
			m = { matches: false };
		} else {
			const mq = new MediaQuery(query);
			m = {
				get matches() {
					return mq.current;
				},
			};
		}
		cache.set(query, m);
	}
	return m;
}

/** `mq.md` is true when the viewport is at least `breakpoints.md` wide. */
export const mq: Readonly<Record<Breakpoint, boolean>> = Object.defineProperties(
	{} as Record<Breakpoint, boolean>,
	Object.fromEntries(
		(Object.keys(breakpoints) as Breakpoint[]).map((bp) => [
			bp,
			{ enumerable: true, get: () => media(minWidth(bp)).matches },
		]),
	),
);
