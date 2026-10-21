<script lang="ts">
	import type { ControlSize } from '$lib/size';
	// Toggle chip — a muted pill/chip that lights up (tinted) when `pressed`.
	// The "on" tint is driven by the `--toggle-accent` CSS var (default accent),
	// so callers recolor it per-use (e.g. warm for behavior, role color for
	// message-type filters) without restyling the base. Used across the
	// conversation toolbar (filters / formatting / behavior / mobile tabs).
	//
	// A chip shares almost nothing visually with Button, so it owns its own
	// <button> + scoped styles rather than specializing the Button atom.
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { playSound } from '$lib/sound';

	let {
		pressed = false,
		pill = false,
		struck = false,
		size = 'sm',
		grow = false,
		shrink = true,
		type = 'button',
		disabled = false,
		sound = true,
		onclick,
		class: klass = '',
		children,
		...rest
	}: HTMLButtonAttributes & {
		pressed?: boolean;
		pill?: boolean;
		struck?: boolean;
		size?: ControlSize;
		// Share a flex row with siblings (flex: 1 1 0).
		grow?: boolean;
		// `shrink={false}` keeps the chip at its intrinsic width (flex: none).
		shrink?: boolean;
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
		children?: Snippet;
	} = $props();

	function click(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		const next = !pressed;
		onclick?.(e);
		if (e.defaultPrevented) return;
		playSound(next ? 'toggle-on' : 'toggle-off', sound);
	}
</script>

<button
	data-tsu="Toggle"
	{...rest}
	{type}
	{disabled}
	onclick={click}
	class="toggle {klass}"
	class:pill
	class:struck
	class:md={size === 'md'}
	class:grow
	class:no-shrink={!shrink}
	class:on={pressed}
	aria-pressed={pressed}
>
	{@render children?.()}
</button>

<style>
	/* The height is pinned to the `--toggle-size` box, never to the line box:
	   an emoji, a 12px Icon and plain text all leave the chip the same height. */
	.toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--sp-1);
		box-sizing: border-box;
		height: var(--toggle-size, var(--control-sm));
		padding: 0 var(--control-px-sm);
		border-radius: var(--r-sm);
		font-size: var(--control-fs-sm);
		font-weight: var(--fw-medium);
		line-height: var(--lh-none);
		--icon-size: var(--control-icon-sm);
		background: var(--bg-elevated-2);
		color: var(--text-muted);
		border: 1px solid var(--border);
		white-space: nowrap;
		user-select: none;
		transition:
			background var(--dur-fast) var(--ease),
			border-color var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease),
			scale var(--dur-fast) var(--ease-out);
	}
	.toggle:disabled {
		opacity: var(--disabled-opacity);
		cursor: not-allowed;
	}
	.toggle.pill {
		border-radius: var(--r-pill);
	}
	.toggle.md {
		height: var(--toggle-size, var(--control-md));
		padding: 0 var(--control-px-md);
		font-size: var(--control-fs-md);
		--icon-size: var(--control-icon-md);
	}
	.toggle.grow {
		flex: 1 1 0;
		min-width: 0;
	}
	.toggle.no-shrink {
		flex: none;
	}
	@media (hover: hover) and (pointer: fine) {
		.toggle:hover:not(:disabled) {
			border-color: var(--border-strong);
		}
	}
	.toggle:active:not(:disabled) {
		scale: var(--press-scale);
		transition-duration: var(--dur-press);
	}
	.toggle.on {
		--tc: var(--toggle-accent, var(--accent));
		color: var(--tc);
		border-color: color-mix(in srgb, var(--tc) 55%, transparent);
		background: color-mix(in srgb, var(--tc) 16%, transparent);
	}
	.toggle.struck {
		text-decoration: line-through;
	}
	@media (pointer: coarse) {
		.toggle {
			position: relative;
		}
		.toggle::before {
			content: '';
			position: absolute;
			inset-block: var(--touch-slab);
			inset-inline-start: var(--touch-slab);
			inset-inline-end: 0;
		}
	}
</style>
