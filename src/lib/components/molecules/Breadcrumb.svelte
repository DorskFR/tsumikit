<script lang="ts" module>
	export interface BreadcrumbItem {
		label: string;
		href?: string;
	}
</script>

<script lang="ts">
	// Navigation trail (e.g. "Musique > Artist > Album > Track"). The last item —
	// or any item without an `href` — renders unlinked and is marked
	// aria-current="page". When the trail exceeds `maxItems` the middle collapses
	// to an ellipsis, always keeping the first item and the tail. `separator` is a
	// snippet for custom markup, else a char via the `char` prop.
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';

	let {
		items,
		char,
		separator,
		maxItems = 0
	}: {
		items: BreadcrumbItem[];
		/** Separator character; ignored when the `separator` snippet is set. */
		char?: string;
		separator?: Snippet;
		/** Collapse the middle to an ellipsis when the trail is longer than this
		 *  (0 = never collapse). Keeps the first item and the last `maxItems - 1`. */
		maxItems?: number;
	} = $props();

	type Crumb = BreadcrumbItem | { ellipsis: true };

	const shown = $derived<Crumb[]>(
		maxItems > 0 && items.length > maxItems
			? [items[0], { ellipsis: true }, ...items.slice(items.length - (maxItems - 1))]
			: items
	);
</script>

<nav aria-label="breadcrumb" data-tsu="Breadcrumb">
	<ol class="crumbs">
		{#each shown as item, i (i)}
			<li class="crumb">
				{#if 'ellipsis' in item}
					<span class="ellipsis" aria-hidden="true">…</span>
				{:else if item.href && i < shown.length - 1}
					<a class="link" href={item.href}>{item.label}</a>
				{:else}
					<span class="current" aria-current="page">{item.label}</span>
				{/if}
				{#if i < shown.length - 1}
					<span class="sep" aria-hidden="true">
						{#if separator}{@render separator()}{:else if char}{char}{:else}<Icon
								name="chevron-right"
								size={14}
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
	.ellipsis {
		color: var(--text-muted);
	}
	.sep {
		display: inline-flex;
		align-items: center;
		color: var(--text-subtle, var(--text-muted));
	}
</style>
