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
	// <button>. Every tinted style derives from the `--badge-tone` custom
	// property, which is the public hook for consumers who theme by CSS.
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
		variant?: 'chip' | 'text';
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
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();

	const t = $derived(canonicalTone(tone));
	const toneColor = $derived(color ?? (t === 'neutral' ? undefined : TONE_COLOR[t]));
	const hasAction = $derived(removable || actionIcon !== undefined);
</script>

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
	class:toned={toneColor !== undefined}
	class:badge-sm={size === 'sm'}
	class:badge-xs={size === 'xs'}
	class:text={variant === 'text'}
	class:mono
	class:uppercase
	class:numeric
	class:truncate
	class:borderless={!border}
	class:active
	class:removed
	class:interactive={as === 'button' || !!href}
	style:--badge-tone={toneColor}
	style:--badge-max-width={maxWidth}
	type={!href && as === 'button' ? 'button' : undefined}
	{...rest}
>
	{#if dot}
		<Dot color="var(--badge-tone, currentColor)" />
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
		--badge-h: var(--chip-md);
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		min-height: var(--badge-h);
		padding: 0 var(--sp-2);
		border-radius: var(--badge-radius, var(--r-pill));
		font-size: var(--badge-fs, var(--fs-xs));
		font-weight: var(--badge-fw, var(--fw-medium));
		line-height: var(--lh-snug);
		--icon-size: var(--icon-xs);
		background: var(--badge-bg, var(--bg-elevated-2));
		color: var(--badge-fg, var(--text-muted));
		border: var(--edge-width) solid var(--badge-border, var(--border));
		white-space: nowrap;
		max-width: var(--badge-max-width, 100%);
	}
	.badge-sm,
	.badge-xs {
		font-size: var(--badge-fs, var(--fs-xs));
		gap: var(--sp-0-5);
	}
	.badge-sm {
		--badge-h: var(--chip-sm);
		padding: 0 var(--sp-1-5);
	}
	.badge-xs {
		--badge-h: var(--chip-xs);
		line-height: var(--lh-none);
	}
	.toned {
		color: var(--badge-fg, var(--badge-tone));
		border-color: var(--badge-border, color-mix(in srgb, var(--badge-tone) 40%, transparent));
		background: var(--badge-bg, color-mix(in srgb, var(--badge-tone) 12%, transparent));
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
		font-family: var(--font-mono);
		font-weight: var(--badge-fw, var(--fw-normal));
	}
	.uppercase {
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: var(--badge-fw, var(--fw-semibold));
	}
	.numeric {
		font-variant-numeric: tabular-nums;
		min-width: var(--badge-min-size, 1.5em);
		min-height: var(--badge-min-size, var(--badge-h));
		justify-content: center;
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
	/* Interactive "on" state: fill the pill with its tone. Falls back to the
	   neutral accent when no tone or colour is set. */
	.active {
		color: var(--text-on-accent);
		background: var(--badge-tone, var(--accent));
		border-color: var(--badge-tone, var(--accent));
	}
	.interactive {
		cursor: pointer;
		transition:
			border-color var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease),
			scale var(--dur-fast) var(--ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.interactive:hover {
			border-color: var(--border-strong);
			color: var(--text);
		}
		.interactive.active:hover {
			color: var(--text-on-accent);
			border-color: var(--badge-tone, var(--accent));
			filter: brightness(1.08);
		}
	}
	.interactive:active:not(:disabled, [aria-disabled='true']) {
		scale: var(--press-scale);
		transition-duration: var(--dur-press);
	}
	.interactive:focus-visible {
		outline: var(--focus-ring-width) solid var(--badge-tone, var(--accent));
		outline-offset: var(--focus-ring-offset);
	}
	.removed {
		opacity: 0.55;
		text-decoration: line-through;
		transition:
			opacity var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease),
			text-decoration-color var(--dur-fast) var(--ease);
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
		opacity: 0.6;
		transition:
			opacity var(--dur-fast) var(--ease),
			background var(--dur-fast) var(--ease),
			scale var(--dur-fast) var(--ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.action:hover {
			opacity: 1;
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
