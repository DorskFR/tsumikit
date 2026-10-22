import { flushSync } from 'svelte';
import { aiming, sectionOf } from './hash';

/**
 * Dormant sections keep their prerendered markup and mount the live examples
 * on demand: on screen at once, within `rootMargin` at the next idle slot, the
 * rest one idle slot at a time once the page has loaded. `?eager` mounts all.
 * Outside a navigation, a mount keeps the first visible section where it was.
 */
export const SSR = typeof window === 'undefined';

const pending = new Map<string, { el: Element; wake: () => void }>();
const soon = new Set<string>();
let io: IntersectionObserver | undefined;
let loaded = false;
let running = false;

const idle = (fn: (deadline?: IdleDeadline) => void) =>
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

export function wake(id: string): void {
	soon.delete(id);
	const p = pending.get(id);
	if (!p) return;
	pending.delete(id);
	io?.unobserve(p.el);
	const focused = document.activeElement;
	const at = focused && focused !== p.el && p.el.contains(focused) ? path(p.el, focused) : null;
	const anchor = aiming() ? null : firstVisible(p.el);
	const before = anchor?.getBoundingClientRect().top ?? 0;
	p.wake();
	flushSync();
	if (anchor) {
		const shift = anchor.getBoundingClientRect().top - before;
		if (Math.abs(shift) >= 1) scrollBy({ top: shift, behavior: 'instant' });
	}
	if (!at) return;
	let n: Element | undefined = p.el;
	for (const i of at) n = n?.children[i];
	if (n instanceof HTMLElement) n.focus({ preventScroll: true });
}

function step(deadline?: IdleDeadline): void {
	do {
		const id = soon.values().next().value ?? (loaded ? pending.keys().next().value : undefined);
		if (id === undefined) {
			running = false;
			return;
		}
		wake(id);
	} while (deadline && deadline.timeRemaining() > 4);
	idle(step);
}

function kick(): void {
	if (running) return;
	running = true;
	idle(step);
}

function setup(): void {
	io = new IntersectionObserver(
		(records) => {
			for (const r of records) {
				if (!r.isIntersecting) continue;
				const onScreen = r.boundingClientRect.bottom > 0 && r.boundingClientRect.top < innerHeight;
				if (onScreen) wake(r.target.id);
				else soon.add(r.target.id);
			}
			if (soon.size) kick();
		},
		{ rootMargin: '150% 0px' },
	);
	addEventListener('focusin', (e) => {
		const el = e.target instanceof Element && e.target.closest('[data-demo-section]');
		if (el) wake(el.id);
	});
	const start = () =>
		setTimeout(() => {
			loaded = true;
			kick();
		}, 300);
	if (document.readyState === 'complete') start();
	else addEventListener('load', start, { once: true });
}

export function startsLive(id: string): boolean {
	return (
		SSR || new URLSearchParams(location.search).has('eager') || sectionOf(location.hash) === id
	);
}

export function defer(el: HTMLElement, wake: () => void): () => void {
	if (!io) setup();
	pending.set(el.id, { el, wake });
	io!.observe(el);
	return () => {
		pending.delete(el.id);
		soon.delete(el.id);
		io?.unobserve(el);
	};
}
