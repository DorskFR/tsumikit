<script lang="ts">
	// Floating panel built on the native Popover API. The platform gives us the
	// top layer (no z-index races, renders above dialogs/sticky headers), light
	// dismiss (click-outside), Escape-to-close and correct focus/`aria-expanded`
	// wiring between the invoker and the panel — all declaratively via the
	// `popovertarget` / `popover` attributes. We add only smart placement:
	// position the panel against its trigger and flip into the viewport when it
	// would overflow. (CSS anchor positioning would replace the JS here once it
	// ships beyond Chromium; the popover semantics above are the hard part and
	// are broadly supported today.)
	import type { Snippet } from 'svelte';
	import { place } from '$lib/floating';

	type Placement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

	let {
		placement = 'bottom-start',
		gap = 6,
		label,
		trigger,
		children,
		triggerClass = '',
		bare = false,
		onopen,
		onclose
	}: {
		placement?: Placement;
		gap?: number;
		/** Accessible name for the trigger. */
		label: string;
		/** Trigger content (rendered inside a button that owns the popover wiring). */
		trigger: Snippet;
		/** Panel content. */
		children: Snippet;
		/** Extra class on the trigger button — style it from your own scoped CSS,
		 *  no :global needed (you supply the class). */
		triggerClass?: string;
		/** Drop the default ghost-icon chrome so the trigger is an unstyled button
		 *  you fully own (pair with `triggerClass`). */
		bare?: boolean;
		onopen?: () => void;
		onclose?: () => void;
	} = $props();

	const id = `pop-${Math.random().toString(36).slice(2, 8)}`;
	let triggerEl = $state<HTMLButtonElement | null>(null);
	let panelEl = $state<HTMLDivElement | null>(null);

	function reposition() {
		if (triggerEl && panelEl) place(triggerEl, panelEl, placement, gap);
	}

	function onToggle(e: ToggleEvent) {
		if (e.newState === 'open') {
			reposition();
			addEventListener('scroll', reposition, true);
			addEventListener('resize', reposition);
			onopen?.();
		} else {
			removeEventListener('scroll', reposition, true);
			removeEventListener('resize', reposition);
			onclose?.();
		}
	}
</script>

<button
	bind:this={triggerEl}
	type="button"
	class="pop-trigger {triggerClass}"
	class:bare
	popovertarget={id}
	aria-label={label}
>
	{@render trigger()}
</button>

<div
	bind:this={panelEl}
	{id}
	popover="auto"
	class="pop-panel"
	role="group"
	aria-label={label}
	ontoggle={onToggle}
>
	{@render children()}
</div>

<style>
	/* The trigger owns its look (a ghost icon-button) from tokens — it no longer
	   borrows global .btn classes, so a consumer can restyle it via `triggerClass`
	   (+ `bare`) from their own scoped CSS instead of fighting globals. */
	.pop-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.25rem;
		min-width: 2.25rem;
		padding: var(--sp-2);
		border: 1px solid transparent;
		border-radius: var(--r-md);
		background: transparent;
		color: var(--text);
		transition:
			background 0.12s var(--ease),
			border-color 0.12s var(--ease);
	}
	.pop-trigger:hover {
		background: var(--bg-elevated-2);
	}
	/* `bare`: strip the chrome down to a plain button the consumer styles. */
	.pop-trigger.bare {
		min-height: 0;
		min-width: 0;
		padding: 0;
		border: 0;
		background: none;
	}
	.pop-trigger.bare:hover {
		background: none;
	}
	.pop-panel {
		position: fixed;
		margin: 0;
		inset: auto; /* JS sets top/left; the popover lives in the top layer */
		min-width: 10rem;
		max-width: min(22rem, calc(100vw - 2 * var(--sp-3)));
		padding: var(--sp-1);
		background: var(--bg-elevated);
		color: var(--text);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
		box-shadow: var(--shadow-md);
	}
	/* Enter animation (skipped under reduced-motion via the global rule). */
	.pop-panel:popover-open {
		animation: pop-in 0.12s var(--ease);
	}
	@keyframes pop-in {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
	}
</style>
