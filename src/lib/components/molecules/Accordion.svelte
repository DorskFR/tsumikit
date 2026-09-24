<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { DisclosureHeaderContext } from './Disclosure.svelte';
	export interface AccordionItem {
		id: string;
		/** Plain-text header; `summary` wins when both are given. */
		title?: string;
		/** Rich header content; receives the live open state. */
		summary?: Snippet<[DisclosureHeaderContext]>;
		/** Panel content for this item. */
		content: Snippet;
		/** Open state. Re-passing a new value takes over from any local toggle. */
		open?: boolean;
		onchange?: (open: boolean) => void;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	// A stack of Disclosures. Each item's `open` is the parent's word: local
	// toggles override it until the parent passes a new value. `multiple=false`
	// closes the other items when one opens.
	import type { HTMLAttributes } from 'svelte/elements';
	import Disclosure from './Disclosure.svelte';
	import type { DisclosureChevron } from './Disclosure.svelte';

	let {
		items,
		multiple = true,
		chevron = 'end',
		onchange,
		class: klass = '',
		style: styleProp = '',
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = $props();

	type Own = {
		items: AccordionItem[];
		multiple?: boolean;
		chevron?: DisclosureChevron;
		onchange?: (id: string, open: boolean) => void;
		class?: string;
		style?: string;
	};

	let local = $state<Record<string, boolean>>({});
	let seen: Record<string, boolean | undefined> = {};

	$effect.pre(() => {
		for (const item of items) {
			if (seen[item.id] !== item.open) {
				seen[item.id] = item.open;
				delete local[item.id];
			}
		}
	});

	const isOpen = (item: AccordionItem) => local[item.id] ?? item.open ?? false;

	function set(item: AccordionItem, open: boolean) {
		local[item.id] = open;
		item.onchange?.(open);
		onchange?.(item.id, open);
		if (!open || multiple) return;
		for (const other of items) {
			if (other.id === item.id || !isOpen(other)) continue;
			local[other.id] = false;
			other.onchange?.(false);
			onchange?.(other.id, false);
		}
	}
</script>

{#snippet plain(title: string | undefined)}
	<span class="acc-title">{title}</span>
{/snippet}

<div {...rest} class="accordion {klass}" style={styleProp} data-tsu="Accordion">
	{#each items as item (item.id)}
		<Disclosure
			class="acc-item"
			id={`acc-${item.id}`}
			open={isOpen(item)}
			onchange={(o) => set(item, o)}
			disabled={item.disabled}
			{chevron}
		>
			{#snippet header(ctx)}
				{#if item.summary}
					{@render item.summary(ctx)}
				{:else}
					{@render plain(item.title)}
				{/if}
			{/snippet}
			{@render item.content()}
		</Disclosure>
	{/each}
</div>

<style>
	.accordion {
		border: 1px solid var(--border);
		border-radius: var(--r-lg);
		overflow: hidden;
	}
	.accordion > :global(.acc-item + .acc-item) {
		border-top: 1px solid var(--border);
	}
	.acc-title {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
