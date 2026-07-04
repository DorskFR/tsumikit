<script lang="ts">
	// Lightweight tooltip. Shows on hover (after a short delay) and on keyboard
	// focus of the trigger; hides on blur / mouseleave / Escape. The trigger is
	// any snippet; an action wires `aria-describedby` onto its first focusable
	// element so screen readers announce the text.
	//
	// The bubble renders in the browser top layer (Popover API, `manual` so it
	// only opens/closes under our control) and is positioned by the shared
	// `place()` helper — so, like Popover, it escapes ancestor overflow/transform
	// clipping and flips/clamps to stay in the viewport. Dependency-free.
	//
	// Rich mode: pass a `content` snippet instead of (or as well as — `content`
	// wins) `text` and the panel renders arbitrary markup: key/value rows, code
	// ids, CopyButton, small buttons. Closing is then hovercard-style: debounced
	// by `closeDelay` and cancelled when the pointer (or focus) enters the panel,
	// so users can move in to select/copy text or click a button. Note the
	// role="tooltip" caveat: `aria-describedby` flattens the panel to its text.
	import type { Snippet } from 'svelte';
	import { place } from '$lib/floating';

	let {
		text,
		content,
		placement = 'top',
		delay = 200,
		closeDelay = 250,
		trigger
	}: {
		/** Plain-text bubble. Ignored when `content` is provided. */
		text?: string;
		/** Rich panel content — makes the panel hover-persistent and selectable. */
		content?: Snippet;
		placement?: 'top' | 'bottom' | 'left' | 'right';
		/** Open delay (ms) on hover. */
		delay?: number;
		/** Grace period (ms) before closing — lets the pointer travel into the panel. */
		closeDelay?: number;
		trigger: Snippet;
	} = $props();

	const id = `tip-${Math.random().toString(36).slice(2, 8)}`;
	let wrapEl = $state<HTMLElement | null>(null);
	let tipEl = $state<HTMLElement | null>(null);
	let showTimer: ReturnType<typeof setTimeout> | undefined;
	let hideTimer: ReturnType<typeof setTimeout> | undefined;

	function reposition() {
		if (wrapEl && tipEl) place(wrapEl, tipEl, `${placement}-center`, 6);
	}

	function show() {
		clearTimeout(hideTimer); // pointer came back within the grace period
		clearTimeout(showTimer);
		showTimer = setTimeout(() => {
			if (!tipEl || tipEl.matches(':popover-open')) return; // re-entry guard
			tipEl.showPopover(); // top layer — displayed before we measure it
			reposition();
			addEventListener('scroll', reposition, true);
			addEventListener('resize', reposition);
		}, delay);
	}
	function hideNow() {
		clearTimeout(showTimer);
		clearTimeout(hideTimer);
		if (tipEl?.matches(':popover-open')) tipEl.hidePopover();
		removeEventListener('scroll', reposition, true);
		removeEventListener('resize', reposition);
	}
	// Debounced close: cancelled if the pointer/focus enters the panel (rich
	// mode) or returns to the trigger before `closeDelay` elapses.
	function scheduleHide() {
		clearTimeout(showTimer);
		clearTimeout(hideTimer);
		hideTimer = setTimeout(hideNow, closeDelay);
	}
	function cancelHide() {
		clearTimeout(hideTimer);
	}

	const FOCUSABLE = 'a[href],button,input,select,textarea,[tabindex]';
	// Action: wire aria-describedby onto the trigger's focusable element AND the
	// hover/focus listeners (attached via the DOM, so the wrapper stays a plain,
	// role-less container — the interactive element is the trigger inside).
	function tooltip(node: HTMLElement) {
		const target = (node.matches(FOCUSABLE) ? node : node.querySelector(FOCUSABLE)) as
			| HTMLElement
			| null;
		target?.setAttribute('aria-describedby', id);
		const onkey = (e: KeyboardEvent) => e.key === 'Escape' && hideNow();
		node.addEventListener('mouseenter', show);
		node.addEventListener('mouseleave', scheduleHide);
		node.addEventListener('focusin', show);
		node.addEventListener('focusout', scheduleHide);
		node.addEventListener('keydown', onkey);
		return {
			destroy() {
				target?.removeAttribute('aria-describedby');
				node.removeEventListener('mouseenter', show);
				node.removeEventListener('mouseleave', scheduleHide);
				node.removeEventListener('focusin', show);
				node.removeEventListener('focusout', scheduleHide);
				node.removeEventListener('keydown', onkey);
			}
		};
	}

	// Action for the panel: in rich mode it accepts the pointer/focus, which
	// cancels the pending close (hovercard persistence).
	function panel(node: HTMLElement) {
		const onkey = (e: KeyboardEvent) => e.key === 'Escape' && hideNow();
		node.addEventListener('mouseenter', cancelHide);
		node.addEventListener('mouseleave', scheduleHide);
		node.addEventListener('focusin', cancelHide);
		node.addEventListener('focusout', scheduleHide);
		node.addEventListener('keydown', onkey);
		return {
			destroy() {
				node.removeEventListener('mouseenter', cancelHide);
				node.removeEventListener('mouseleave', scheduleHide);
				node.removeEventListener('focusin', cancelHide);
				node.removeEventListener('focusout', scheduleHide);
				node.removeEventListener('keydown', onkey);
			}
		};
	}
</script>

<span class="tip-wrap" data-tsu="Tooltip" bind:this={wrapEl} use:tooltip>
	{@render trigger()}
</span>

<div
	bind:this={tipEl}
	{id}
	role="tooltip"
	popover="manual"
	class="tip"
	class:rich={!!content}
	use:panel
>
	{#if content}{@render content()}{:else}{text}{/if}
</div>

<style>
	.tip-wrap {
		display: inline-flex;
	}
	.tip {
		position: fixed;
		margin: 0;
		inset: auto; /* JS sets top/left; the popover lives in the top layer */
		max-width: 16rem;
		width: max-content;
		padding: var(--sp-1) var(--sp-2);
		background: var(--bg-elevated-2);
		color: var(--text);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-sm);
		box-shadow: var(--shadow-md);
		font-size: var(--fs-xs);
		line-height: 1.4;
		white-space: normal;
		pointer-events: none; /* non-interactive: never steals hover/clicks */
	}
	/* Rich panel: interactive + selectable so the user can move the pointer in
	   to copy an id or click a button (the close grace period allows the trip). */
	.tip.rich {
		pointer-events: auto;
		user-select: text;
		max-width: min(22rem, calc(100vw - 2 * var(--sp-3)));
		padding: var(--sp-2);
		border-radius: var(--r-md);
	}
	/* Fade/scale in when shown (skipped under reduced-motion via the global rule). */
	.tip:popover-open {
		animation: tip-in 0.12s var(--ease);
	}
	@keyframes tip-in {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
	}
</style>
