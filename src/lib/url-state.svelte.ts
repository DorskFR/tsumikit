import { createSubscriber } from 'svelte/reactivity';

export interface UrlStateOptions<T> {
	/** Value when the param is absent; a value serializing to the same string removes the param. */
	default: T;
	parse?: (raw: string) => T;
	serialize?: (value: T) => string;
	/** Add a history entry per change instead of replacing the current one. */
	push?: boolean;
}

export interface UrlState<T> {
	value: T;
	/** The current URL with the param set to `value` — for `href` on Tabs, SegmentedControl and Pagination. */
	href(value: T): string;
}

/**
 * One search param as reactive state: `value` reads the param (or `default`),
 * assigning writes it back with `history.replaceState` (`pushState` with
 * `push`), and the browser's back/forward keep it in sync. Without a `window`
 * it holds `default`, so it is safe to create during SSR.
 */
export function urlState<T = string>(key: string, options: UrlStateOptions<T>): UrlState<T> {
	const parse = options.parse ?? ((raw: string) => raw as unknown as T);
	const serialize = options.serialize ?? ((value: T) => String(value));
	const fallback = serialize(options.default);

	const read = (): T => {
		if (typeof window === 'undefined') return options.default;
		const raw = new URLSearchParams(window.location.search).get(key);
		return raw === null ? options.default : parse(raw);
	};
	const urlFor = (value: T): URL => {
		const url = new URL(window.location.href);
		const raw = serialize(value);
		if (raw === fallback) url.searchParams.delete(key);
		else url.searchParams.set(key, raw);
		return url;
	};

	let current = $state.raw(read());
	const subscribe = createSubscriber(() => {
		const sync = () => {
			current = read();
		};
		window.addEventListener('popstate', sync);
		return () => window.removeEventListener('popstate', sync);
	});

	return {
		get value() {
			if (typeof window === 'undefined') return current;
			if (!$effect.tracking()) return read();
			subscribe();
			return current;
		},
		set value(next: T) {
			current = next;
			if (typeof window === 'undefined') return;
			const url = urlFor(next);
			if (url.href === window.location.href) return;
			window.history[options.push ? 'pushState' : 'replaceState'](window.history.state, '', url);
		},
		href(value: T) {
			if (typeof window === 'undefined') return `?${key}=${encodeURIComponent(serialize(value))}`;
			const url = urlFor(value);
			return `${url.pathname}${url.search}${url.hash}`;
		},
	};
}

/** A click the browser should keep: modifier keys or a non-primary button (open in a new tab/window). */
export function isModifiedClick(e: MouseEvent): boolean {
	return e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;
}
