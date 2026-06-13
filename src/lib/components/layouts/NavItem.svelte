<script lang="ts">
	// Sidebar navigation item: icon + label. When the surrounding `sidebar`
	// query container gets narrow (≤ 8rem — e.g. the user drags AppShell's
	// resizable sidebar down to a rail) the label hides and the icon centers,
	// purely in CSS. `title`/`aria-label` carry the name so the icon-only state
	// stays accessible and shows a tooltip. Renders an <a> when `href` is set,
	// else a <button>.
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import type { IconName } from '$lib/components/atoms/Icon.svelte';

	let {
		icon,
		label,
		href,
		active = false,
		onclick,
		children,
		...rest
	}: {
		icon: IconName;
		label: string;
		href?: string;
		active?: boolean;
		onclick?: (e: MouseEvent) => void;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	{href}
	type={href ? undefined : 'button'}
	class="nav-item"
	class:active
	title={label}
	aria-label={label}
	aria-current={active ? 'page' : undefined}
	{onclick}
	{...rest}
>
	<Icon name={icon} size={18} />
	<span class="nav-label">{label}</span>
	{#if children}<span class="nav-trail">{@render children()}</span>{/if}
</svelte:element>

<style>
	.nav-item {
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
	.nav-label {
		flex: 1;
		min-width: 0; /* allow the label to shrink/ellipsis instead of overflowing */
		overflow: hidden;
		text-overflow: ellipsis;
	}
	/* Icon-rail: when the sidebar container is narrow, drop the label + trailing
	   slot and center the icon. Driven by the sidebar's width, not the viewport. */
	@container sidebar (max-width: 8rem) {
		.nav-item {
			justify-content: center;
			padding-inline: 0;
		}
		.nav-label,
		.nav-trail {
			display: none;
		}
	}
</style>
