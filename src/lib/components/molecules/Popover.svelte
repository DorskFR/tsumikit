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
	type TriggerVariant = 'default' | 'primary' | 'ghost' | 'danger';
	type TriggerTone = 'none' | 'accent' | 'success' | 'info' | 'warn' | 'danger';
	type TriggerSize = 'sm' | 'md' | 'lg';

	let {
		placement = 'bottom-start',
		gap = 6,
		label,
		trigger,
		children,
		triggerClass = '',
		bare = false,
		variant,
		tone = 'none',
		size,
		control = false,
		block = false,
		disabled = false,
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
		/** Button-compatible trigger chrome. Omitting every chrome prop preserves
		 *  the original ghost icon-button trigger. */
		variant?: TriggerVariant;
		tone?: TriggerTone;
		size?: TriggerSize;
		/** Use the shared `--control-height` toolbar/composer contract. */
		control?: boolean;
		block?: boolean;
		disabled?: boolean;
		onopen?: () => void;
		onclose?: () => void;
	} = $props();

	const canonicalChrome = $derived(
		variant !== undefined || tone !== 'none' || size !== undefined || control || block
	);

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
	data-tsu="Popover"
	type="button"
	class="pop-trigger {triggerClass}"
	class:bare
	class:canonical={canonicalChrome}
	class:trigger-primary={variant === 'primary'}
	class:trigger-ghost={variant === 'ghost'}
	class:trigger-danger={variant === 'danger'}
	class:trigger-sm={size === 'sm'}
	class:trigger-lg={size === 'lg'}
	class:trigger-control={control}
	class:trigger-block={block}
	class:trigger-tone-accent={tone === 'accent'}
	class:trigger-tone-success={tone === 'success'}
	class:trigger-tone-info={tone === 'info'}
	class:trigger-tone-warn={tone === 'warn'}
	class:trigger-tone-danger={tone === 'danger'}
	popovertarget={id}
	aria-label={label}
	{disabled}
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
	.pop-trigger:hover:not(:disabled) {
		background: var(--bg-elevated-2);
	}
	/* Supplying canonical chrome props opts into the same dimensions, variants
	   and state tones as Button while keeping this one native trigger element. */
	.pop-trigger.canonical {
		min-width: 0;
		min-height: var(--control-height-default);
		padding: var(--sp-2) var(--sp-4);
		border-color: var(--border-strong);
		background: var(--surface);
		font-weight: var(--fw-medium);
		font-size: var(--fs-sm);
		line-height: 1;
		user-select: none;
		white-space: nowrap;
	}
	.pop-trigger.canonical:hover:not(:disabled) {
		border-color: var(--accent);
		background: var(--surface);
	}
	.pop-trigger.trigger-primary {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--text-on-accent);
		font-weight: var(--fw-semibold);
	}
	.pop-trigger.trigger-primary:hover:not(:disabled) {
		background: var(--accent);
		border-color: var(--accent);
		filter: brightness(1.08);
	}
	.pop-trigger.trigger-ghost {
		background: transparent;
		border-color: transparent;
	}
	.pop-trigger.trigger-ghost:hover:not(:disabled) {
		background: var(--bg-elevated-2);
		border-color: transparent;
	}
	.pop-trigger.trigger-danger {
		color: var(--danger);
		border-color: color-mix(in srgb, var(--danger) 50%, var(--border));
	}
	.pop-trigger.trigger-danger:hover:not(:disabled) {
		background: color-mix(in srgb, var(--danger) 14%, transparent);
		border-color: var(--danger);
	}
	.pop-trigger.trigger-sm {
		height: var(--control-height-compact);
		min-height: var(--control-height-compact);
		padding: var(--sp-1) var(--sp-3);
		font-size: var(--fs-xs);
	}
	.pop-trigger.trigger-lg {
		min-height: var(--control-height-large);
		padding: var(--sp-3) var(--sp-5);
		font-size: var(--fs-base);
	}
	.pop-trigger.trigger-control {
		height: var(--control-height);
		min-height: var(--control-height);
		padding: 0 var(--sp-3);
	}
	.pop-trigger.trigger-block {
		width: 100%;
	}
	.pop-trigger.trigger-tone-accent {
		--pop-trigger-tone: var(--accent);
	}
	.pop-trigger.trigger-tone-success {
		--pop-trigger-tone: var(--ok);
	}
	.pop-trigger.trigger-tone-info {
		--pop-trigger-tone: var(--info);
	}
	.pop-trigger.trigger-tone-warn {
		--pop-trigger-tone: var(--warn);
	}
	.pop-trigger.trigger-tone-danger {
		--pop-trigger-tone: var(--danger);
	}
	.pop-trigger.trigger-tone-accent,
	.pop-trigger.trigger-tone-success,
	.pop-trigger.trigger-tone-info,
	.pop-trigger.trigger-tone-warn,
	.pop-trigger.trigger-tone-danger {
		color: var(--pop-trigger-tone);
		border-color: color-mix(in srgb, var(--pop-trigger-tone) 50%, var(--border));
	}
	.pop-trigger.trigger-tone-accent:hover:not(:disabled),
	.pop-trigger.trigger-tone-success:hover:not(:disabled),
	.pop-trigger.trigger-tone-info:hover:not(:disabled),
	.pop-trigger.trigger-tone-warn:hover:not(:disabled),
	.pop-trigger.trigger-tone-danger:hover:not(:disabled) {
		background: color-mix(in srgb, var(--pop-trigger-tone) 14%, transparent);
		border-color: var(--pop-trigger-tone);
	}
	.pop-trigger.trigger-primary.trigger-tone-success {
		background: var(--ok);
		border-color: var(--ok);
		color: var(--text-on-success);
	}
	.pop-trigger.trigger-primary.trigger-tone-success:hover:not(:disabled) {
		background: var(--ok);
		border-color: var(--ok);
		filter: brightness(1.08);
	}
	.pop-trigger:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	/* `bare`: strip the chrome down to a plain button the consumer styles. */
	.pop-trigger.bare {
		height: auto;
		min-height: 0;
		min-width: 0;
		width: auto;
		padding: 0;
		border: 0;
		background: none;
	}
	.pop-trigger.bare:hover:not(:disabled) {
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
