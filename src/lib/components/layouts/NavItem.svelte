<script lang="ts">
	// Sidebar navigation item: icon + label, with an optional trailing count
	// `badge`. When the surrounding `sidebar` query container gets narrow
	// (≤ 8rem — e.g. the user drags AppShell's resizable sidebar down to a rail)
	// the label hides and the icon centers, purely in CSS; a non-empty badge then
	// collapses to a small dot indicator so the count cue survives the rail.
	// `title`/`aria-label` carry the name so the icon-only state stays accessible
	// and shows a tooltip. Renders an <a> when `href` is set, else a <button>.
	// The glyph is `iconChildren` (raw 24×24 SVG content), else `iconPath`
	// (single path d), else the registry `icon`.
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import type { IconName } from '$lib/components/atoms/Icon.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';

	type BadgeTone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';

	let {
		icon,
		iconChildren,
		iconPath,
		iconSize = 18,
		label,
		href,
		active = false,
		activeStyle = 'fill',
		onclick,
		badge,
		badgeTone = 'neutral',
		orientation = 'horizontal',
		children,
		class: klass = '',
		...rest
	}: {
		icon?: IconName;
		/** Raw 24×24 SVG content, for glyphs outside the registry. Wins over `iconPath` and `icon`. */
		iconChildren?: Snippet;
		/** Single `<path d>` for a 24×24 outline glyph. Wins over `icon`. */
		iconPath?: string;
		iconSize?: number;
		label: string;
		href?: string;
		active?: boolean;
		/** 'fill' = accent-tinted pill with a rounded left marker; 'bar' = lighter
		 *  tint with a flat 2px inset accent bar. */
		activeStyle?: 'fill' | 'bar';
		onclick?: (e: MouseEvent) => void;
		/** Optional trailing count pill (e.g. unread / missing items). When the
		 *  item is `active` it adopts the accent fill; otherwise it uses `badgeTone`. */
		badge?: string | number;
		/** Tone for the trailing badge when the item is not active. */
		badgeTone?: BadgeTone;
		/** `vertical` stacks the icon over the label with the badge overlaid on the
		 *  icon corner (bottom tab bars). */
		orientation?: 'horizontal' | 'vertical';
		children?: Snippet;
		[key: string]: unknown;
		class?: string;
		style?: string;
	} = $props();

	// Treat 0 / '' as "no badge" so callers can pass a raw count without guarding.
	const hasBadge = $derived(badge !== undefined && badge !== null && badge !== '' && badge !== 0);
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	data-tsu="NavItem"
	{href}
	type={href ? undefined : 'button'}
	class="nav-item {klass}"
	class:vertical={orientation === 'vertical'}
	class:active
	class:bar={activeStyle === 'bar'}
	title={label}
	aria-label={label}
	aria-current={active ? 'page' : undefined}
	{onclick}
	{...rest}
>
	{#if iconChildren}
		<Icon size={iconSize}>{@render iconChildren()}</Icon>
	{:else if iconPath}
		<Icon size={iconSize}><path d={iconPath} /></Icon>
	{:else if icon}
		<Icon name={icon} size={iconSize} />
	{/if}
	<span class="nav-label">{label}</span>
	{#if hasBadge}
		<span class="nav-trail">
			<Badge size="sm" tone={active ? 'neutral' : badgeTone} active={active}>{badge}</Badge>
		</span>
		<!-- Rail fallback: the pill is hidden by the container query below, this dot
		     takes over so the "has items" cue still reads in the icon rail. -->
		<span class="nav-dot" class:active aria-hidden="true"></span>
	{:else if children}
		<span class="nav-trail">{@render children()}</span>
	{/if}
</svelte:element>

<style>
	.nav-item {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		width: 100%;
		text-align: left;
		padding: var(--sp-2) var(--sp-3);
		border: none;
		background: none;
		color: var(--text-muted);
		border-radius: var(--r-md);
		font-size: var(--fs-sm);
		font-weight: var(--fw-medium);
		text-decoration: none;
		white-space: nowrap;
		transition:
			background 0.12s var(--ease),
			color 0.12s var(--ease);
	}
	.nav-item:hover {
		background: var(--bg-elevated-2);
		color: var(--text);
		text-decoration: none;
	}
	.nav-item.active {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		color: var(--accent);
	}
	/* Active-route accent inset: a left rail marker that survives the icon-rail
	   collapse (the tint background does too, but the marker reads at a glance). */
	.nav-item.active:not(.bar)::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 3px;
		height: 60%;
		border-radius: var(--r-pill);
		background: var(--accent);
	}
	.nav-item.bar.active {
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		box-shadow: inset 2px 0 0 var(--accent);
		border-start-start-radius: 0;
		border-end-start-radius: 0;
	}
	.nav-label {
		flex: 1;
		min-width: 0; /* allow the label to shrink/ellipsis instead of overflowing */
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.nav-trail {
		flex: none;
	}
	.nav-item.vertical {
		flex-direction: column;
		justify-content: center;
		gap: 2px;
		padding: var(--sp-1) var(--sp-2);
		font-size: var(--fs-xs);
		text-align: center;
	}
	.nav-item.vertical .nav-trail {
		position: absolute;
		top: 0;
		left: calc(50% + 0.4rem);
	}
	/* Dot is the rail-width stand-in for the badge: hidden at full width. */
	.nav-dot {
		display: none;
	}

	/* Icon-rail: when the sidebar container is narrow, drop the label + trailing
	   pill and center the icon. Driven by the sidebar's width, not the viewport.
	   A badge collapses to a dot pinned to the icon's top-right corner. */
	@container sidebar (max-width: 8rem) {
		.nav-item {
			justify-content: center;
			padding-inline: 0;
		}
		.nav-label,
		.nav-trail {
			display: none;
		}
		.nav-dot {
			display: block;
			position: absolute;
			top: 0.4rem;
			right: 0.9rem;
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: var(--warn);
		}
		.nav-dot.active {
			background: var(--accent);
		}
	}
</style>
