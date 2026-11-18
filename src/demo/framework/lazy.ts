import { flushSync } from 'svelte';
import { aiming, sectionOf } from './hash';

/**
 * Dormant sections keep their prerendered markup until approached, focused or
 * navigated to: on screen they mount at once, within `rootMargin` at the next
 * idle slot. `?eager` mounts all.
 */
export const SSR = typeof window === 'undefined';

type Pending = { el: Element; load: () => Promise<unknown>; mount: (value: unknown) => void };

const pending = new Map<string, Pending>();
const soon = new Set<string>();
let io: IntersectionObserver | undefined;
let running = false;

const idle = (fn: () => void) =>
	typeof requestIdleCallback === 'function'
		? requestIdleCallback(fn, { timeout: 1000 })
		: setTimeout(fn, 24);

function path(root: Element, el: Element): number[] {
	const at: number[] = [];
	for (let n = el; n !== root && n.parentElement; n = n.parentElement)
		at.unshift([...n.parentElement.children].indexOf(n));
	return at;
}

function firstVisible(from: Element): Element | null {
	const all = [...document.querySelectorAll('[data-demo-section]')];
	for (const n of all.slice(all.indexOf(from))) if (n.getBoundingClientRect().bottom > 0) return n;
	return null;
}

function mount({ el, mount }: Pending, value: unknown): void {
	if (!el.isConnected) return;
	const focused = document.activeElement;
	const at = focused && focused !== el && el.contains(focused) ? path(el, focused) : null;
	const anchor = aiming() || el.getBoundingClientRect().top >= 0 ? null : firstVisible(el);
	const before = anchor?.getBoundingClientRect().top ?? 0;
	mount(value);
	flushSync();
	if (anchor) {
		const shift = anchor.getBoundingClientRect().top - before;
		if (Math.abs(shift) >= 1) scrollBy({ top: shift, behavior: 'instant' });
	}
	if (!at) return;
	let n: Element | undefined = el;
	for (const i of at) n = n?.children[i];
	if (n instanceof HTMLElement) n.focus({ preventScroll: true });
}

export function wake(id: string): Promise<void> {
	soon.delete(id);
	const p = pending.get(id);
	if (!p) return Promise.resolve();
	pending.delete(id);
	io?.unobserve(p.el);
	return p.load().then(
		(value) => mount(p, value),
		() => {
			if (p.el.isConnected) pending.set(id, p);
		},
	);
}

function step(): void {
	const id = soon.values().next().value;
	if (id === undefined) {
		running = false;
		return;
	}
	wake(id).finally(() => idle(step));
}

function kick(): void {
	if (running) return;
	running = true;
	idle(step);
}

function setup(): IntersectionObserver {
	const observer = new IntersectionObserver(
		(records) => {
			for (const r of records) {
				if (!r.isIntersecting) continue;
				const id = r.target.id;
				const onScreen = r.boundingClientRect.bottom > 0 && r.boundingClientRect.top < innerHeight;
				if (onScreen) wake(id);
				else if (pending.has(id)) {
					pending.get(id)?.load();
					soon.add(id);
				}
			}
			if (soon.size) kick();
		},
		{ rootMargin: '150% 0px' },
	);
	io = observer;
	addEventListener('focusin', (e) => {
		const el = e.target instanceof Element && e.target.closest('[data-demo-section]');
		if (el) wake(el.id);
	});
	return observer;
}

function startsLive(id: string): boolean {
	return (
		typeof IntersectionObserver === 'undefined' ||
		new URLSearchParams(location.search).has('eager') ||
		sectionOf(location.hash) === id
	);
}

export function defer<T>(
	el: HTMLElement,
	load: () => Promise<T>,
	mount: (value: T) => void,
): () => void {
	const id = el.id;
	pending.set(id, { el, load, mount: mount as (value: unknown) => void });
	if (startsLive(id)) wake(id);
	else (io ?? setup()).observe(el);
	return () => {
		if (pending.get(id)?.el === el) pending.delete(id);
		soon.delete(id);
		io?.unobserve(el);
	};
}
