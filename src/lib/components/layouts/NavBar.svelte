<script lang="ts">
	// Horizontal route navigation: a `<nav>` landmark of `<a>` links, one marked
	// `aria-current="page"`. `placement="bar"` pins it to the bottom edge over
	// `--z-nav` and pads for the iOS home indicator with `--safe-bottom`;
	// `placement="inline"` is a plain row for a header. `orientation` stacks the
	// icon over the label (phone bar) or sits it beside (header).
	import Icon from '$lib/components/atoms/Icon.svelte';
	import type { IconName } from '$lib/components/atoms/Icon.svelte';

	export interface NavBarItem {
		href: string;
		label: string;
		icon?: IconName;
		/** Rendered instead of `icon` when set. */
		emoji?: string;
		/** Count or short text pinned to the glyph. 0 / '' render nothing. */
		badge?: number | string;
		current?: boolean;
	}

	let {
		items,
		label,
		placement = 'inline',
		orientation = 'stacked',
		maxWidth,
		class: klass = '',
		style: styleProp = '',
		...rest
	}: {
		items: NavBarItem[];
		/** Accessible name of the `<nav>` landmark. */
		label: string;
		/** 'bar' = fixed to the bottom edge with safe-area padding. */
		placement?: 'bar' | 'inline';
		/** Icon over label vs icon beside label. */
		orientation?: 'stacked' | 'inline';
		/** Caps and centres the row of links. */
		maxWidth?: string;
		class?: string;
		style?: string;
		[key: string]: unknown;
	} = $props();

	const hasBadge = (badge: NavBarItem['badge']) =>
		badge !== undefined && badge !== null && badge !== '' && badge !== 0;
</script>

<nav
	data-tsu="NavBar"
	aria-label={label}
	class="navbar {klass}"
	class:bar={placement === 'bar'}
	class:stacked={orientation === 'stacked'}
	style="{maxWidth ? `--navbar-max: ${maxWidth};` : ''}{styleProp}"
	{...rest}
>
	<div class="navbar-inner">
		{#each items as item (item.href)}
			<a
				href={item.href}
				class="navbar-link"
				class:current={item.current}
				aria-current={item.current ? 'page' : undefined}
			>
				<span class="navbar-glyph">
					{#if item.emoji}
						<span class="navbar-emoji" aria-hidden="true">{item.emoji}</span>
					{:else if item.icon}
						<Icon name={item.icon} size={20} />
					{/if}
					{#if hasBadge(item.badge)}
						<span class="navbar-badge">{item.badge}</span>
					{/if}
				</span>
				<span class="navbar-label">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>

<style>
	.navbar {
		--navbar-max: none;
		min-width: 0;
	}
	.navbar-inner {
		display: flex;
		align-items: stretch;
		justify-content: space-around;
		gap: var(--sp-1);
		min-width: 0;
		max-width: var(--navbar-max);
		margin-inline: auto;
		min-height: var(--nav-h);
	}
	.bar {
		position: fixed;
		inset-inline: 0;
		bottom: 0;
		z-index: var(--z-nav);
		padding-bottom: var(--safe-bottom);
		padding-inline: max(var(--safe-left), var(--sp-1)) max(var(--safe-right), var(--sp-1));
		background: color-mix(in srgb, var(--bg-elevated) 88%, transparent);
		backdrop-filter: blur(12px);
		border-top: 1px solid var(--border);
	}
	.navbar-link {
		position: relative;
		display: flex;
		flex: 1 1 0;
		min-width: 0;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		padding: var(--sp-2);
		border-radius: var(--r-md);
		color: var(--text-muted);
		font-size: var(--fs-sm);
		font-weight: var(--fw-medium);
		text-decoration: none;
		transition:
			background 0.12s var(--ease),
			color 0.12s var(--ease);
	}
	.stacked .navbar-link {
		flex-direction: column;
		gap: 2px;
		font-size: var(--fs-xs);
	}
	.navbar-link:hover {
		background: var(--bg-elevated-2);
		color: var(--text);
		text-decoration: none;
	}
	.navbar-link.current {
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}
	.navbar-glyph {
		position: relative;
		display: inline-flex;
		flex: none;
		align-items: center;
	}
	.navbar-emoji {
		font-size: 1.15em;
		line-height: 1;
	}
	.navbar-label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.navbar-badge {
		position: absolute;
		top: -0.35rem;
		left: calc(100% - 0.35rem);
		padding-inline: 0.25rem;
		min-width: 1rem;
		border-radius: var(--r-pill);
		background: var(--accent);
		color: var(--text-on-accent);
		font-size: var(--fs-xs);
		line-height: 1rem;
		text-align: center;
	}
</style>
