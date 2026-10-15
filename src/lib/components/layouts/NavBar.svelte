<script lang="ts">
	// Horizontal navigation: a `<nav>` landmark of items, one marked current.
	// An item with `href` is an `<a aria-current="page">`; one without is a
	// `<button>` that sets the bindable `value`. When every item is a button the
	// row is a `tablist` (roving tabindex, ←/→/Home/End, `aria-selected`).
	// `placement="bar"` pins it to the bottom edge over `--z-nav` with safe-area
	// padding; `variant="floating"` makes it an inset rounded card. `center`
	// reserves a notch in the middle of the row, items split around it.
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import type { IconName } from '$lib/components/atoms/Icon.svelte';

	export interface NavBarItem {
		/** Renders an `<a>`; without it the item is a `<button>`. */
		href?: string;
		/** Selects the item through the bar's `value`. */
		value?: string;
		label: string;
		icon?: IconName;
		/** Rendered instead of `icon` when set. */
		emoji?: string;
		/** Count or short text pinned to the glyph. 0 / '' render nothing. */
		badge?: number | string;
		/** Overrides the `value` match. */
		current?: boolean;
		/** `preventDefault()` skips the `value` change. */
		onclick?: (e: MouseEvent) => void;
		/** Id of the panel a tab shows (`aria-controls`). */
		controls?: string;
	}

	let {
		items,
		label,
		value = $bindable(),
		onchange,
		center,
		placement = 'inline',
		orientation = 'stacked',
		variant = 'flush',
		maxWidth,
		class: klass = '',
		style: styleProp = '',
		...rest
	}: {
		items: NavBarItem[];
		/** Accessible name of the `<nav>` landmark. */
		label: string;
		/** `value` of the current item, for in-page views without routes. */
		value?: string;
		onchange?: (value: string) => void;
		/** Fills a notch in the middle of the row (`--navbar-center-w`), may rise above it (`--navbar-center-raise`). */
		center?: Snippet;
		/** 'bar' = fixed to the bottom edge with safe-area padding. */
		placement?: 'bar' | 'inline';
		/** Icon over label vs icon beside label. */
		orientation?: 'stacked' | 'inline';
		/** 'floating' = rounded elevated card inset from the edges. */
		variant?: 'flush' | 'floating';
		/** Caps and centres the row of items. */
		maxWidth?: string;
		class?: string;
		style?: string;
		[key: string]: unknown;
	} = $props();

	const hasBadge = (badge: NavBarItem['badge']) =>
		badge !== undefined && badge !== null && badge !== '' && badge !== 0;

	const tabs = $derived(items.length > 0 && items.every((item) => !item.href));
	const isCurrent = (item: NavBarItem) =>
		item.current ?? (item.value !== undefined && item.value === value);
	const focusIndex = $derived(Math.max(0, items.findIndex(isCurrent)));
	const split = $derived(Math.ceil(items.length / 2));

	function select(item: NavBarItem, e: MouseEvent) {
		item.onclick?.(e);
		if (e.defaultPrevented || item.value === undefined || item.value === value) return;
		value = item.value;
		onchange?.(item.value);
	}

	function onkeydown(e: KeyboardEvent) {
		const list = e.currentTarget as HTMLElement;
		const all = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
		const i = all.indexOf(e.target as HTMLButtonElement);
		if (i < 0) return;
		let next: number;
		if (e.key === 'ArrowRight') next = (i + 1) % all.length;
		else if (e.key === 'ArrowLeft') next = (i - 1 + all.length) % all.length;
		else if (e.key === 'Home') next = 0;
		else if (e.key === 'End') next = all.length - 1;
		else return;
		e.preventDefault();
		all[next].focus();
		all[next].click();
	}
</script>

{#snippet glyph(item: NavBarItem)}
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
{/snippet}

{#snippet entry(item: NavBarItem, i: number)}
	{#if item.href}
		<a
			href={item.href}
			class="navbar-link"
			class:current={isCurrent(item)}
			aria-current={isCurrent(item) ? 'page' : undefined}
			onclick={(e) => select(item, e)}
		>
			{@render glyph(item)}
		</a>
	{:else if tabs}
		<button
			type="button"
			role="tab"
			class="navbar-link"
			class:current={isCurrent(item)}
			aria-selected={isCurrent(item)}
			aria-controls={item.controls}
			tabindex={i === focusIndex ? 0 : -1}
			onclick={(e) => select(item, e)}
		>
			{@render glyph(item)}
		</button>
	{:else}
		<button
			type="button"
			class="navbar-link"
			class:current={isCurrent(item)}
			aria-current={isCurrent(item) ? 'page' : undefined}
			onclick={(e) => select(item, e)}
		>
			{@render glyph(item)}
		</button>
	{/if}
{/snippet}

<nav
	data-tsu="NavBar"
	aria-label={label}
	class="navbar {klass}"
	class:bar={placement === 'bar'}
	class:floating={variant === 'floating'}
	class:stacked={orientation === 'stacked'}
	style="{maxWidth ? `--navbar-max: ${maxWidth};` : ''}{styleProp}"
	{...rest}
>
	<div class="navbar-row">
		<div
			class="navbar-inner"
			class:split={!!center}
			role={tabs ? 'tablist' : undefined}
			aria-label={tabs ? label : undefined}
			onkeydown={tabs ? onkeydown : undefined}
		>
			{#if center}
				<div class="navbar-side" role="none">
					{#each items.slice(0, split) as item, i (`${i}:${item.href ?? item.value ?? item.label}`)}
						{@render entry(item, i)}
					{/each}
				</div>
				<span class="navbar-notch" aria-hidden="true"></span>
				<div class="navbar-side" role="none">
					{#each items.slice(split) as item, j (`${split + j}:${item.href ?? item.value ?? item.label}`)}
						{@render entry(item, split + j)}
					{/each}
				</div>
			{:else}
				{#each items as item, i (`${i}:${item.href ?? item.value ?? item.label}`)}
					{@render entry(item, i)}
				{/each}
			{/if}
		</div>
		{#if center}
			<div class="navbar-center">{@render center()}</div>
		{/if}
	</div>
</nav>

<style>
	.navbar {
		--navbar-max: none;
		min-width: 0;
	}
	.navbar-row {
		position: relative;
		min-width: 0;
		max-width: var(--navbar-max);
		margin-inline: auto;
	}
	.navbar-inner {
		display: flex;
		align-items: stretch;
		justify-content: space-around;
		gap: var(--sp-1);
		min-width: 0;
		min-height: var(--nav-h);
	}
	.navbar-inner.split {
		display: grid;
		grid-template-columns: minmax(0, 1fr) var(--navbar-center-w, 4.5rem) minmax(0, 1fr);
	}
	.navbar-side {
		display: flex;
		align-items: stretch;
		gap: var(--sp-1);
		min-width: 0;
	}
	.navbar-center {
		position: absolute;
		top: calc(-1 * var(--navbar-center-raise, 0px));
		bottom: var(--navbar-center-raise, 0px);
		left: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--navbar-center-w, 4.5rem);
		transform: translateX(-50%);
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
	.floating {
		padding: var(--sp-1);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
		background: var(--bg-elevated);
		box-shadow: var(--shadow-md);
	}
	.bar.floating {
		left: calc(var(--sp-2) + var(--safe-left));
		right: calc(var(--sp-2) + var(--safe-right));
		bottom: calc(var(--sp-2) + var(--safe-bottom));
		backdrop-filter: none;
	}
	.navbar-link {
		position: relative;
		display: flex;
		flex: 1 1 0;
		min-width: 0;
		min-height: var(--touch-target);
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		padding: var(--sp-2);
		border: none;
		border-radius: var(--r-md);
		background: none;
		color: var(--text-muted);
		font: inherit;
		font-size: var(--fs-sm);
		font-weight: var(--fw-medium);
		text-decoration: none;
		cursor: pointer;
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
