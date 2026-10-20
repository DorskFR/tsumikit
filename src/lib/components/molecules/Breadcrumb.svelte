<script lang="ts" module>
	export interface BreadcrumbItem {
		label: string;
		href?: string;
	}
</script>

<script lang="ts">
	// Navigation trail (e.g. "Musique > Artist > Album > Track"). The last item
	// renders unlinked with aria-current="page"; other items without an `href`
	// render as plain text. When the trail exceeds `maxItems` the middle collapses
	// to an ellipsis, always keeping the first item and the tail. `separator` is a
	// snippet for custom markup, else a char via the `char` prop.
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';

	let {
		items,
		char,
		separator,
		maxItems = 0,
		size = 'sm',
		wrap = true,
		collapseCurrent = false,
		class: klass = '',
		style: styleProp = '',
	}: {
		items: BreadcrumbItem[];
		/** Separator character; ignored when the `separator` snippet is set. */
		char?: string;
		separator?: Snippet;
		/** Collapse the middle to an ellipsis when the trail is longer than this
		 *  (0 = never collapse). Keeps the first item and the last `maxItems - 1`;
		 *  values below 2 behave as 2 so the current page always shows. */
		maxItems?: number;
		size?: 'sm' | 'md';
		/** `false` keeps the trail on one line: ancestors keep their width and the
		 *  current crumb shrinks with an ellipsis. */
		wrap?: boolean;
		/** Hide the current crumb and its separator, keeping only the ancestors. */
		collapseCurrent?: boolean;
		class?: string;
		style?: string;
	} = $props();

	type Crumb = BreadcrumbItem | { ellipsis: true };

	const shown = $derived<Crumb[]>(
		maxItems > 0 && items.length > maxItems
			? [items[0], { ellipsis: true }, ...items.slice(items.length - (Math.max(2, maxItems) - 1))]
			: items
	);
</script>

<nav aria-label="breadcrumb" data-tsu="Breadcrumb" class={klass} style={styleProp}>
	<ol
		class={[
			'crumbs',
			size === 'md' && 'crumbs--md',
			!wrap && 'crumbs--nowrap',
			collapseCurrent && 'crumbs--collapse',
		]}
	>
		{#each shown as item, i (i)}
			<li class="crumb">
				{#if 'ellipsis' in item}
					<span class="ellipsis" aria-hidden="true">…</span>
				{:else if item.href && i < shown.length - 1}
					<a class="link" href={item.href}>{item.label}</a>
				{:else}
					<span class="current" aria-current={i === shown.length - 1 ? 'page' : undefined}>{item.label}</span>
				{/if}
				{#if i < shown.length - 1}
					<span class="sep" aria-hidden="true">
						{#if separator}{@render separator()}{:else if char}{char}{:else}<Icon
								name="chevron-right"
								size={size === 'md' ? 16 : 14}
							/>{/if}
					</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.crumbs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--sp-1);
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: var(--fs-sm);
	}
	.crumbs--md {
		font-size: var(--fs-md);
	}
	.crumbs--nowrap {
		flex-wrap: nowrap;
		min-width: 0;
	}
	.crumbs--nowrap .crumb {
		flex-shrink: 0;
	}
	.crumbs--nowrap .crumb:last-child {
		flex-shrink: 1;
	}
	.crumbs--nowrap .current {
		max-width: none;
	}
	.crumbs--collapse .crumb:last-child:not(:first-child),
	.crumbs--collapse .crumb:nth-last-child(2) .sep {
		display: none;
	}
	.crumb {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		min-width: 0;
	}
	.link {
		color: var(--text-muted);
		text-decoration: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 16ch;
		transition: color 0.12s var(--ease);
	}
	.link:hover {
		color: var(--text);
		text-decoration: underline;
	}
	.current {
		color: var(--text);
		font-weight: var(--fw-medium);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 24ch;
	}
	@media (hover: none) and (pointer: coarse) {
		.link {
			min-height: 40px;
			align-content: center;
		}
	}
	.ellipsis {
		color: var(--text-muted);
	}
	.sep {
		display: inline-flex;
		align-items: center;
		color: var(--text-subtle, var(--text-muted));
	}
</style>
