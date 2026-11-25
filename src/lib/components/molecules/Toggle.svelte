<script lang="ts">
	import type { ControlSize } from '$lib/size';
	import { canonicalTone, type Tone } from '$lib/tone';
	// Toggle chip — a muted pill/chip that lights up (tinted) when `pressed`.
	// The "on" tint follows `tone` (default accent), so callers recolor it
	// per-use (e.g. warn for behavior, a role tone for message-type filters).
	// Used across the conversation toolbar (filters / formatting / behavior /
	// mobile tabs).
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
		tone = 'accent',
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
		/** Colour of the pressed tint. */
		tone?: Tone;
		size?: ControlSize;
		// Share a flex row with siblings (flex: 1 1 0).
		grow?: boolean;
		// `shrink={false}` keeps the chip at its intrinsic width (flex: none).
		shrink?: boolean;
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
		children?: Snippet;
	} = $props();

	const t = $derived(canonicalTone(tone));

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
	class:tone-neutral={t === 'neutral'}
	class:tone-ok={t === 'ok'}
	class:tone-warn={t === 'warn'}
	class:tone-danger={t === 'danger'}
	class:tone-info={t === 'info'}
	aria-pressed={pressed}
>
	<span class="label">{@render children?.()}</span>
</button>

<style>
	/* The height is pinned to the control box, never to the line box:
	   an emoji, a 12px Icon and plain text all leave the chip the same height. */
	.toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--sp-1);
		box-sizing: border-box;
		height: var(--control-sm);
		padding: 0 var(--control-px-sm);
		border-radius: var(--r-sm);
		font-size: var(--control-fs-sm);
		font-weight: var(--fw-semibold);
		line-height: var(--lh-none);
		background: var(--surface-fill-2);
		color: var(--text-muted);
		border: var(--edge-width) solid var(--surface-edge);
		white-space: nowrap;
		user-select: none;
		transition:
			background var(--dur-fast) var(--ease),
			border-color var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease),
			translate var(--dur-fast) var(--ease),
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
		height: var(--control-md);
		padding: 0 var(--control-px-md);
		font-size: var(--control-fs-md);
	}
	.toggle :global(.icon) {
		font-size: var(--control-icon-sm);
	}
	.toggle.md :global(.icon) {
		font-size: var(--control-icon-md);
	}
	.label {
		display: contents;
	}
	.toggle.grow {
		flex: 1 1 0;
		min-width: 0;
	}
	.toggle.grow .label {
		display: block;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: center;
	}
	.toggle.no-shrink {
		flex: none;
	}
	@media (hover: hover) and (pointer: fine) {
		.toggle:hover:not(:disabled) {
			border-color: var(--surface-edge-strong);
			translate: 0 calc(-1 * var(--hover-lift));
		}
	}
	.toggle:active:not(:disabled) {
		scale: var(--press-scale);
		transition-duration: var(--dur-press);
	}
	.toggle.on {
		color: var(--accent);
		border-color: color-mix(in srgb, var(--accent) 55%, transparent);
		background: color-mix(in srgb, var(--accent) 16%, transparent);
	}
	.toggle.on.tone-neutral {
		color: var(--text);
		border-color: color-mix(in srgb, var(--text) 55%, transparent);
		background: color-mix(in srgb, var(--text) 16%, transparent);
	}
	.toggle.on.tone-ok {
		color: var(--ok);
		border-color: color-mix(in srgb, var(--ok) 55%, transparent);
		background: color-mix(in srgb, var(--ok) 16%, transparent);
	}
	.toggle.on.tone-warn {
		color: var(--warn);
		border-color: color-mix(in srgb, var(--warn) 55%, transparent);
		background: color-mix(in srgb, var(--warn) 16%, transparent);
	}
	.toggle.on.tone-danger {
		color: var(--danger);
		border-color: color-mix(in srgb, var(--danger) 55%, transparent);
		background: color-mix(in srgb, var(--danger) 16%, transparent);
	}
	.toggle.on.tone-info {
		color: var(--info);
		border-color: color-mix(in srgb, var(--info) 55%, transparent);
		background: color-mix(in srgb, var(--info) 16%, transparent);
	}
	.toggle.struck {
		text-decoration: line-through;
	}
	.toggle {
		position: relative;
	}
	.toggle::before {
		content: '';
		position: absolute;
		inset-block: var(--hit-slab);
		inset-inline-start: var(--hit-slab);
		inset-inline-end: 0;
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
