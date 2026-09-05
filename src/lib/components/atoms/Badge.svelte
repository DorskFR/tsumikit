<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	// Inline label primitive — the project's single pill. Covers three jobs via
	// props rather than separate components:
	//   • state  → `tone` semantic palette, or `color` for any CSS colour
	//   • info   → `mono` for paths/ids/code-ish metadata
	//   • tag    → `removable` renders a dismiss button + fires `onremove`
	// Polymorphic via `as` so it can be a static <span> or an interactive
	// <button>. Every tinted style derives from the `--badge-tone` custom
	// property, which is the public hook for consumers who theme by CSS.
	import type { Snippet } from 'svelte';
	import Dot from './Dot.svelte';
	import Icon, { type IconName } from './Icon.svelte';

	type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info' | 'accent' | 'muted' | 'violet';

	const TONE_COLOR: Record<Exclude<Tone, 'neutral'>, string> = {
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
		class: klass = '',
		grow = false,
		shrink = true,
		block = false,
		children,
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();

	const toneColor = $derived(color ?? (tone === 'neutral' ? undefined : TONE_COLOR[tone]));
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
	class:badge-ok={tone === 'ok'}
	class:badge-warn={tone === 'warn'}
	class:badge-danger={tone === 'danger'}
	class:badge-info={tone === 'info'}
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
	class:interactive={as === 'button' || !!href}
	style:--badge-tone={toneColor}
	style:--badge-max-width={maxWidth}
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
	{#if removable}
		<button
			type="button"
			class="remove"
			aria-label="Remove"
			onclick={(e) => onremove?.(e)}
		>
			×
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
	.badge {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		padding: 0.15rem var(--sp-2);
		border-radius: var(--r-pill);
		font-size: var(--fs-xs);
		font-weight: var(--fw-medium);
		line-height: 1.4;
		background: var(--bg-elevated-2);
		color: var(--text-muted);
		border: 1px solid var(--border);
		white-space: nowrap;
		max-width: var(--badge-max-width, 100%);
	}
	.badge-sm,
	.badge-xs {
		font-size: calc(var(--fs-xs) * 0.92);
		gap: 0.15rem;
	}
	.badge-sm {
		padding: 0 0.4rem;
	}
	.badge-xs {
		padding: 0.05rem var(--sp-2);
	}
	.toned {
		color: var(--badge-tone);
		border-color: color-mix(in srgb, var(--badge-tone) 40%, transparent);
		background: color-mix(in srgb, var(--badge-tone) 12%, transparent);
	}
	.text {
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
			border-color 0.12s var(--ease),
			color 0.12s var(--ease);
	}
	.interactive:hover {
		border-color: var(--border-strong);
		color: var(--text);
	}
	.interactive.active:hover {
		color: var(--text-on-accent);
		border-color: var(--badge-tone, var(--accent));
		filter: brightness(1.08);
	}
	.interactive:focus-visible {
		outline: 2px solid var(--badge-tone, var(--accent));
		outline-offset: 2px;
	}
	.remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin: 0 -0.15rem 0 0;
		padding: 0 0.1rem;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		line-height: 1;
		cursor: pointer;
		opacity: 0.6;
		transition: opacity 0.12s var(--ease);
	}
	.remove:hover {
		opacity: 1;
	}
</style>
