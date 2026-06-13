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
	import type { Snippet } from 'svelte';
	import { place } from '$lib/floating';

	let {
		text,
		placement = 'top',
		delay = 200,
		trigger
	}: {
		text: string;
		placement?: 'top' | 'bottom' | 'left' | 'right';
		delay?: number;
		trigger: Snippet;
	} = $props();

	const id = `tip-${Math.random().toString(36).slice(2, 8)}`;
	let wrapEl = $state<HTMLElement | null>(null);
	let tipEl = $state<HTMLElement | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function reposition() {
		if (wrapEl && tipEl) place(wrapEl, tipEl, `${placement}-center`, 6);
	}

	function show() {
		clearTimeout(timer);
		timer = setTimeout(() => {
			if (!tipEl || tipEl.matches(':popover-open')) return; // re-entry guard
			tipEl.showPopover(); // top layer — displayed before we measure it
			reposition();
			addEventListener('scroll', reposition, true);
			addEventListener('resize', reposition);
		}, delay);
	}
	function hide() {
		clearTimeout(timer);
		if (tipEl?.matches(':popover-open')) tipEl.hidePopover();
		removeEventListener('scroll', reposition, true);
		removeEventListener('resize', reposition);
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
		const onkey = (e: KeyboardEvent) => e.key === 'Escape' && hide();
		node.addEventListener('mouseenter', show);
		node.addEventListener('mouseleave', hide);
		node.addEventListener('focusin', show);
		node.addEventListener('focusout', hide);
		node.addEventListener('keydown', onkey);
		return {
			destroy() {
				target?.removeAttribute('aria-describedby');
				node.removeEventListener('mouseenter', show);
				node.removeEventListener('mouseleave', hide);
				node.removeEventListener('focusin', show);
				node.removeEventListener('focusout', hide);
				node.removeEventListener('keydown', onkey);
			}
		};
	}
</script>

<span class="tip-wrap" bind:this={wrapEl} use:tooltip>
	{@render trigger()}
</span>

<span bind:this={tipEl} {id} role="tooltip" popover="manual" class="tip">
	{text}
</span>

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
