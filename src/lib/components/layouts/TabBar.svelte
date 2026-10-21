<script lang="ts">
	// Phone bottom tab bar: fixed to the bottom edge with safe-area padding.
	// Items without `href` form a `tablist` of `tab`s with roving focus; with
	// `href` the bar is a `<nav>` of `<a aria-current="page">`. While mounted as
	// a bar it publishes its measured height as `--tabbar-h` on `<html>` so
	// content can clear it (`padding-bottom: var(--tabbar-h)`).
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import type { IconName } from '$lib/components/atoms/Icon.svelte';
	import { formatCount, hasCount } from '$lib/count';
	import { playSound } from '$lib/sound';

	export interface TabBarItem {
		id: string;
		label: string;
		icon?: IconName;
		/** Renders an `<a>`; without it the item is a `<button role="tab">`. */
		href?: string;
		/** Count (capped at `99+`) or short text pinned to the glyph. 0 / '' render nothing. */
		badge?: number | string;
		/** Id of the panel a tab shows (`aria-controls`). */
		controls?: string;
	}

	let {
		items,
		value = $bindable(),
		onselect,
		label = 'Primary',
		placement = 'bar',
		sound = true,
		class: klass = '',
		...rest
	}: {
		items: TabBarItem[];
		/** `id` of the selected item. */
		value?: string;
		onselect?: (id: string, item: TabBarItem) => void;
		/** Accessible name of the bar. */
		label?: string;
		/** 'bar' = fixed to the bottom edge; 'inline' = flows with its parent. */
		placement?: 'bar' | 'inline';
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
		class?: string;
		[key: string]: unknown;
	} = $props();

	const links = $derived(items.some((item) => item.href));
	const isCurrent = (item: TabBarItem) => item.id === value;
	const focusIndex = $derived(Math.max(0, items.findIndex(isCurrent)));
	const badgeText = (badge: TabBarItem['badge']) =>
		typeof badge === 'number' ? (hasCount(badge) ? formatCount(badge) : '') : (badge ?? '');

	let height = $state(0);

	$effect(() => {
		if (placement !== 'bar' || typeof document === 'undefined') return;
		const root = document.documentElement;
		root.style.setProperty('--tabbar-h', `${height}px`);
		return () => root.style.removeProperty('--tabbar-h');
	});

	function select(item: TabBarItem) {
		if (item.id === value) return;
		value = item.id;
		playSound('click', sound);
		onselect?.(item.id, item);
	}

	function onkeydown(e: KeyboardEvent) {
		const all = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('.tabbar-item')];
		const i = all.indexOf(e.target as HTMLElement);
		if (i < 0) return;
		let next: number;
		if (e.key === 'ArrowRight') next = (i + 1) % all.length;
		else if (e.key === 'ArrowLeft') next = (i - 1 + all.length) % all.length;
		else if (e.key === 'Home') next = 0;
		else if (e.key === 'End') next = all.length - 1;
		else return;
		e.preventDefault();
		all[next].focus();
		if (!links) select(items[next]);
	}
</script>

{#snippet glyph(item: TabBarItem)}
	<span class="tabbar-glyph">
		{#if item.icon}
			<Icon name={item.icon} />
		{/if}
		{#if badgeText(item.badge)}
			<Badge class="tabbar-badge" tone="accent" size="xs" border={false} active numeric={typeof item.badge === 'number'}>
				{badgeText(item.badge)}
			</Badge>
		{/if}
	</span>
	<span class="tabbar-label">{item.label}</span>
{/snippet}

<nav
	bind:offsetHeight={height}
	data-tsu="TabBar"
	aria-label={label}
	class="tabbar {klass}"
	class:bar={placement === 'bar'}
	{...rest}
>
	<div
		class="tabbar-row"
		role={links ? undefined : 'tablist'}
		aria-label={links ? undefined : label}
		{onkeydown}
	>
		{#each items as item, i (item.id)}
			{#if item.href}
				<a
					href={item.href}
					class="tabbar-item"
					class:current={isCurrent(item)}
					aria-current={isCurrent(item) ? 'page' : undefined}
					onclick={() => select(item)}
				>
					{@render glyph(item)}
				</a>
			{:else}
				<button
					type="button"
					role="tab"
					class="tabbar-item"
					class:current={isCurrent(item)}
					aria-selected={isCurrent(item)}
					aria-controls={item.controls}
					tabindex={i === focusIndex ? 0 : -1}
					onclick={() => select(item)}
				>
					{@render glyph(item)}
				</button>
			{/if}
		{/each}
	</div>
</nav>

<style>
	.tabbar {
		min-width: 0;
		background: var(--bg-elevated);
		border-top: 1px solid var(--border);
	}
	.bar {
		position: fixed;
		inset-inline: 0;
		bottom: 0;
		z-index: var(--z-nav);
		padding-bottom: env(safe-area-inset-bottom, 0px);
		padding-inline: env(safe-area-inset-left, 0px) env(safe-area-inset-right, 0px);
		background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
		backdrop-filter: blur(12px);
	}
	.tabbar-row {
		display: flex;
		align-items: stretch;
		min-width: 0;
		min-height: var(--nav-h);
	}
	.tabbar-item {
		position: relative;
		display: flex;
		flex: 1 1 0;
		min-width: 0;
		min-height: max(48px, var(--touch-target));
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--sp-0-5);
		padding: var(--sp-1) var(--sp-2);
		border: none;
		border-radius: 0;
		background: none;
		color: var(--text-muted);
		font: inherit;
		font-size: var(--fs-xs);
		font-weight: var(--fw-medium);
		text-decoration: none;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition: color var(--dur-fast) var(--ease);
	}
	@media (hover: hover) and (pointer: fine) {
		.tabbar-item:hover {
			color: var(--text);
			text-decoration: none;
		}
	}
	.tabbar-item:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset-inset);
	}
	.tabbar-item.current {
		color: var(--accent);
	}
	.tabbar-glyph {
		position: relative;
		display: inline-flex;
		flex: none;
		align-items: center;
		font-size: var(--icon-xl);
		--icon-size: var(--icon-xl);
		transition: scale var(--dur-fast) var(--ease-out);
	}
	.tabbar-item:active .tabbar-glyph {
		scale: var(--press-scale-sm);
		transition-duration: var(--dur-press);
	}
	.tabbar-label {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tabbar :global(.tabbar-badge) {
		position: absolute;
		top: -0.4rem;
		left: calc(100% - 2px);
		max-width: none;
		padding-inline: var(--sp-1-5);
		font-size: var(--fs-xs);
	}
</style>
