<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	// Inline label primitive — the project's single pill. Covers three jobs via
	// props rather than separate components:
	//   • state  → `tone` semantic palette, or `color` for any CSS colour
	//   • info   → `mono` for paths/ids/code-ish metadata
	//   • tag    → `removable` renders a dismiss button + fires `onremove`;
	//              `actionIcon`/`onaction` swap in any other trailing action and
	//              `removed` mutes + strikes the pill for a "restorable" state
	// Polymorphic via `as` so it can be a static <span> or an interactive
	// <button>.
	import type { Snippet } from 'svelte';
	import Dot from './Dot.svelte';
	import Icon, { type IconName } from './Icon.svelte';
	import { canonicalTone, type Tone as SharedTone } from '$lib/tone';

	type Tone = SharedTone | 'muted' | 'violet';

	const TONE_COLOR: Record<Exclude<Tone, 'neutral' | 'success'>, string> = {
		ok: 'var(--ok)',
		warn: 'var(--warn)',
		danger: 'var(--danger)',
		info: 'var(--info)',
		accent: 'var(--accent)',
		muted: 'var(--text-muted)',
		violet: 'var(--c-violet)',
	};

	type Own = {
		tone?: Tone;
		/** Fill the free space of a flex row (`flex: 1 1 0`). */
		grow?: boolean;
		/** `false` pins the box (`flex: none`) so a flex row cannot squeeze it. */
		shrink?: boolean;
		/** Full-width block. */
		block?: boolean;
		// Any CSS colour (or var()) for a one-off tint; overrides `tone`.
		color?: string;
		as?: 'span' | 'button' | 'a';
		/** Renders an anchor (implies `as="a"`). */
		href?: string;
		/** Opens in a new tab with a trailing arrow glyph. */
		external?: boolean;
		// `xs` is the densest form for counters in tight rows.
		size?: 'xs' | 'sm' | 'md';
		// `text` drops the chip (no fill, ring or padding) but keeps badge
		// typography and tint — for mono metadata that must not read as a pill.
		// `solid` fills the pill with its tone (accent when there is none).
		variant?: 'chip' | 'text' | 'solid';
		mono?: boolean;
		// Uppercase, letter-spaced label — for status tags/eyebrows.
		uppercase?: boolean;
		// Tabular digits with a minimum width so counters don't jitter.
		numeric?: boolean;
		// Clip long content with an ellipsis instead of overflowing.
		truncate?: boolean;
		maxWidth?: string;
		// Borderless "soft" variant: tone-tinted fill pill with no ring. The
		// default (`true`) keeps the outlined look for backwards compatibility.
		border?: boolean;
		// Interactive "on" state for a toggle/count badge (`as="button"`): fills the
		// pill with its tone instead of just tinting the border.
		active?: boolean;
		// Leading status dot in the badge colour.
		dot?: boolean;
		icon?: IconName;
		removable?: boolean;
		onremove?: (e: MouseEvent) => void;
		/** Trailing action glyph; renders the action button even without `removable`. */
		actionIcon?: IconName;
		/** Accessible name for the action button (defaults to "Remove"). */
		actionLabel?: string;
		onaction?: (e: MouseEvent) => void;
		/** Muted, struck-through look for an entry pending removal. */
		removed?: boolean;
		class?: string;
		children?: Snippet;
	};
	let {
		tone = 'neutral',
		color,
		as = 'span',
		href,
		external = false,
		size = 'md',
		variant = 'chip',
		mono = false,
		uppercase = false,
		numeric = false,
		truncate = false,
		maxWidth,
		border = true,
		active = false,
		dot = false,
		icon,
		removable = false,
		onremove,
		actionIcon,
		actionLabel,
		onaction,
		removed = false,
		class: klass = '',
		grow = false,
		shrink = true,
		block = false,
		children,
		style: styleProp,
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();

	const t = $derived(canonicalTone(tone));
	const toneColor = $derived(color ?? (t === 'neutral' ? undefined : TONE_COLOR[t]));
	const hasAction = $derived(removable || actionIcon !== undefined);
	const clickable = $derived(as === 'button' || !!href);
	const inline = $derived((color ? `color: ${color};` : '') + (maxWidth ? `max-width: ${maxWidth};` : ''));
</script>

{#snippet content()}
{#if dot}
	<Dot color={toneColor ?? 'currentColor'} />
{/if}
{#if icon}
	<Icon name={icon} />
{/if}
{#if truncate}
	<span class="clip">{@render children?.()}</span>
{:else}
	{@render children?.()}
{/if}
{#if href && external}<Icon name="external" />{/if}
{#if hasAction}
	<button
		type="button"
		class="action"
		aria-label={actionLabel ?? 'Remove'}
		onclick={(e) => (onaction ?? onremove)?.(e)}
	>
		{#if actionIcon}<Icon name={actionIcon} />{:else}×{/if}
	</button>
{/if}
{/snippet}

<svelte:element
	this={href ? 'a' : as}
	{href}
	target={href && external ? '_blank' : undefined}
	rel={href && external ? 'noopener noreferrer' : undefined}
	data-tsu="Badge"
	class="badge {klass}"
	class:grow={grow}
	class:no-shrink={!shrink}
	class:block={block}
	class:badge-ok={t === 'ok'}
	class:badge-warn={t === 'warn'}
	class:badge-danger={t === 'danger'}
	class:badge-info={t === 'info'}
	class:badge-accent={t === 'accent'}
	class:badge-muted={t === 'muted'}
	class:badge-violet={t === 'violet'}
	class:toned={toneColor !== undefined}
	class:badge-custom={color !== undefined}
	class:badge-sm={size === 'sm'}
	class:badge-xs={size === 'xs'}
	class:text={variant === 'text'}
	class:solid={variant === 'solid'}
	class:mono
	class:uppercase
	class:numeric
	class:truncate
	class:borderless={!border}
	class:active
	class:removed
	class:interactive={clickable}
	style={inline + (styleProp ?? '') || undefined}
	type={!href && as === 'button' ? 'button' : undefined}
	{...rest}
>
	{#if color !== undefined}
		<span class="badge-ink">{@render content()}</span>
	{:else}
		{@render content()}
	{/if}
</svelte:element>

<style>
	.grow {
		flex: 1 1 0;
		min-width: 0;
	}
	.no-shrink {
		flex: none;
	}
	.block {
		display: flex;
		width: 100%;
	}
	/* Chip heights sit on the 4px grid (md 24 / sm 20 / xs 16) through a
	   min-height, so the leading never decides the box. */
	.badge {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		min-height: var(--chip-md);
		padding: 0 var(--sp-2);
		border-radius: var(--r-pill);
		font-size: var(--fs-xs);
		font-weight: var(--fw-semibold);
		line-height: var(--lh-snug);
		background: var(--bg-elevated-2);
		color: var(--text-muted);
		border: var(--edge-width) solid var(--border);
		white-space: nowrap;
		max-width: 100%;
	}
	.badge :global(.icon) {
		font-size: var(--icon-xs);
	}
	.badge-sm,
	.badge-xs {
		font-size: var(--fs-xs);
		gap: var(--sp-0-5);
	}
	.badge-sm {
		min-height: var(--chip-sm);
		padding: 0 var(--sp-1);
	}
	.badge-xs {
		min-height: var(--chip-xs);
		line-height: var(--lh-none);
	}
	.badge-ok {
		color: color-mix(in oklab, var(--ok) 75%, var(--text));
		border-color: color-mix(in srgb, var(--ok) 40%, transparent);
		background: color-mix(in srgb, var(--ok) 12%, transparent);
	}
	.badge-warn {
		color: color-mix(in oklab, var(--warn) 75%, var(--text));
		border-color: color-mix(in srgb, var(--warn) 40%, transparent);
		background: color-mix(in srgb, var(--warn) 12%, transparent);
	}
	.badge-danger {
		color: color-mix(in oklab, var(--danger) 75%, var(--text));
		border-color: color-mix(in srgb, var(--danger) 40%, transparent);
		background: color-mix(in srgb, var(--danger) 12%, transparent);
	}
	.badge-info {
		color: color-mix(in oklab, var(--info) 75%, var(--text));
		border-color: color-mix(in srgb, var(--info) 40%, transparent);
		background: color-mix(in srgb, var(--info) 12%, transparent);
	}
	.badge-accent {
		color: color-mix(in oklab, var(--accent) 75%, var(--text));
		border-color: color-mix(in srgb, var(--accent) 40%, transparent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}
	.badge-muted {
		color: color-mix(in oklab, var(--text-muted) 75%, var(--text));
		border-color: color-mix(in srgb, var(--text-muted) 40%, transparent);
		background: color-mix(in srgb, var(--text-muted) 12%, transparent);
	}
	.badge-violet {
		color: color-mix(in oklab, var(--c-violet) 75%, var(--text));
		border-color: color-mix(in srgb, var(--c-violet) 40%, transparent);
		background: color-mix(in srgb, var(--c-violet) 12%, transparent);
	}
	.badge-custom {
		border-color: color-mix(in srgb, currentColor 40%, transparent);
		background: color-mix(in srgb, currentColor 12%, transparent);
	}
	.badge-ink {
		display: contents;
		color: color-mix(in oklab, currentColor 75%, var(--text));
	}
	.text {
		min-height: 0;
		padding: 0;
		border-color: transparent;
		background: none;
		border-radius: 0;
	}
	/* Soft variant: drop the ring, keep the tinted fill. Transparent (not
	   `border: 0`) so layout/baseline matches the outlined default exactly. */
	.borderless {
		border-color: transparent;
	}
	.mono {
		font-family: var(--font-numeric);
		font-variant-numeric: tabular-nums;
		font-weight: var(--fw-normal);
	}
	.uppercase {
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: var(--fw-semibold);
	}
	.numeric {
		font-variant-numeric: tabular-nums;
		min-width: 1.5em;
		min-height: var(--chip-md);
		justify-content: center;
	}
	.numeric.badge-sm {
		min-height: var(--chip-sm);
	}
	.numeric.badge-xs {
		min-height: var(--chip-xs);
	}
	.truncate {
		min-width: 0;
	}
	.clip {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	/* Interactive "on" state and the solid variant: fill the pill with its tone.
	   Falls back to the accent when no tone or colour is set. */
	.active,
	.solid {
		color: var(--text-on-accent);
		background: var(--accent);
		border-color: var(--accent);
	}
	.active.badge-ok,
	.solid.badge-ok {
		background: var(--ok);
		border-color: var(--ok);
	}
	.active.badge-warn,
	.solid.badge-warn {
		background: var(--warn);
		border-color: var(--warn);
	}
	.active.badge-danger,
	.solid.badge-danger {
		background: var(--danger);
		border-color: var(--danger);
	}
	.active.badge-info,
	.solid.badge-info {
		background: var(--info);
		border-color: var(--info);
	}
	.active.badge-muted,
	.solid.badge-muted {
		background: var(--text-muted);
		border-color: var(--text-muted);
	}
	.active.badge-violet,
	.solid.badge-violet {
		background: var(--c-violet);
		border-color: var(--c-violet);
	}
	.active.badge-custom,
	.solid.badge-custom {
		background: currentColor;
		border-color: currentColor;
	}
	.active > .badge-ink,
	.solid > .badge-ink {
		color: var(--text-on-accent);
		color: color(from currentColor srgb-linear clamp(0, (0.179 - (0.2126 * r + 0.7152 * g + 0.0722 * b)) * 1000, 1) clamp(0, (0.179 - (0.2126 * r + 0.7152 * g + 0.0722 * b)) * 1000, 1) clamp(0, (0.179 - (0.2126 * r + 0.7152 * g + 0.0722 * b)) * 1000, 1));
	}
	.interactive {
		cursor: pointer;
		transition:
			border-color var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease),
			scale var(--dur-fast) var(--ease-out);
	}
	.interactive > .badge-ink {
		transition: color var(--dur-fast) var(--ease);
	}
	@media (hover: hover) and (pointer: fine) {
		.interactive:hover {
			border-color: var(--border-strong);
			color: var(--text);
		}
		.interactive.active:hover,
		.interactive.solid:hover {
			color: var(--text-on-accent);
			border-color: var(--accent);
			filter: brightness(1.08);
		}
		.interactive.active.badge-ok:hover,
		.interactive.solid.badge-ok:hover {
			border-color: var(--ok);
		}
		.interactive.active.badge-warn:hover,
		.interactive.solid.badge-warn:hover {
			border-color: var(--warn);
		}
		.interactive.active.badge-danger:hover,
		.interactive.solid.badge-danger:hover {
			border-color: var(--danger);
		}
		.interactive.active.badge-info:hover,
		.interactive.solid.badge-info:hover {
			border-color: var(--info);
		}
		.interactive.active.badge-muted:hover,
		.interactive.solid.badge-muted:hover {
			border-color: var(--text-muted);
		}
		.interactive.active.badge-violet:hover,
		.interactive.solid.badge-violet:hover {
			border-color: var(--c-violet);
		}
		.interactive.active.badge-custom:hover,
		.interactive.solid.badge-custom:hover {
			border-color: currentColor;
		}
		.interactive:hover > .badge-ink {
			color: var(--text);
		}
		.interactive.active:hover > .badge-ink,
		.interactive.solid:hover > .badge-ink {
			color: var(--text-on-accent);
			color: color(from currentColor srgb-linear clamp(0, (0.179 - (0.2126 * r + 0.7152 * g + 0.0722 * b)) * 1000, 1) clamp(0, (0.179 - (0.2126 * r + 0.7152 * g + 0.0722 * b)) * 1000, 1) clamp(0, (0.179 - (0.2126 * r + 0.7152 * g + 0.0722 * b)) * 1000, 1));
		}
	}
	.interactive:active:not(:disabled, [aria-disabled='true']) {
		scale: var(--press-scale);
		transition-duration: var(--dur-press);
	}
	.interactive:focus-visible {
		outline: var(--focus-ring-width) solid var(--accent);
		outline-offset: var(--focus-ring-offset);
	}
	.interactive.badge-ok:focus-visible {
		outline-color: var(--ok);
	}
	.interactive.badge-warn:focus-visible {
		outline-color: var(--warn);
	}
	.interactive.badge-danger:focus-visible {
		outline-color: var(--danger);
	}
	.interactive.badge-info:focus-visible {
		outline-color: var(--info);
	}
	.interactive.badge-muted:focus-visible {
		outline-color: var(--text-muted);
	}
	.interactive.badge-violet:focus-visible {
		outline-color: var(--c-violet);
	}
	.interactive.badge-custom:focus-visible {
		outline-color: currentColor;
	}
	.removed {
		opacity: 0.55;
		text-decoration: line-through;
		transition:
			opacity var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease),
			text-decoration-color var(--dur-fast) var(--ease);
	}
	.removed.badge-custom {
		text-decoration-color: color-mix(in oklab, currentColor 75%, var(--text));
	}
	.removed .action {
		text-decoration: none;
	}
	.action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin: 0 calc(-1 * var(--sp-0-5)) 0 0;
		padding: 0 var(--sp-0-5);
		border: 0;
		border-radius: var(--r-xs);
		background: none;
		color: inherit;
		font: inherit;
		line-height: var(--lh-none);
		cursor: pointer;
		transition:
			background var(--dur-fast) var(--ease),
			scale var(--dur-fast) var(--ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.action:hover {
			background: color-mix(in srgb, currentColor 12%, transparent);
			transition-duration: var(--dur-instant);
		}
	}
	.action:active {
		scale: var(--press-scale-sm);
		transition-duration: var(--dur-press);
	}
	/* The ring sits inside: a truncating badge clips its box. */
	.action:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset-inset);
	}
	.action {
		position: relative;
	}
	.action::before {
		content: '';
		position: absolute;
		inset-block: var(--hit-slab);
		inset-inline-start: var(--hit-slab);
		inset-inline-end: 0;
	}
	@media (pointer: coarse) {
		.action {
			position: relative;
		}
		.action::before {
			content: '';
			position: absolute;
			inset-block: var(--touch-slab);
			inset-inline-start: var(--touch-slab);
			inset-inline-end: 0;
		}
	}
</style>
