<script lang="ts">
	// Horizontal action bar. Below `collapseBelow` (measured on the bar's own box)
	// every child marked `data-overflow` is hidden and a `…` button opens a Menu
	// with `items` (or the `overflow` snippet in a Popover) that stands in for
	// them. `sticky` pins the bar under `stickyOffset`.
	import type { Snippet } from 'svelte';
	import IconButton from '$lib/components/molecules/IconButton.svelte';
	import Menu, { type MenuItem } from '$lib/components/molecules/Menu.svelte';
	import Popover from '$lib/components/molecules/Popover.svelte';

	let {
		children,
		items,
		overflow,
		collapseBelow,
		sticky = false,
		stickyOffset = '0px',
		density = 'default',
		overflowLabel = 'More',
		label,
		class: klass = '',
		style: styleProp = ''
	}: {
		children: Snippet;
		/** Menu rows standing in for the collapsed `data-overflow` children. */
		items?: MenuItem[];
		/** Free-form panel content instead of `items`. */
		overflow?: Snippet;
		/** Width (px/em/rem) under which `data-overflow` children collapse. */
		collapseBelow?: string;
		sticky?: boolean;
		stickyOffset?: string;
		density?: 'compact' | 'default';
		overflowLabel?: string;
		/** Accessible name of the bar (`role="toolbar"`). */
		label?: string;
		class?: string;
		style?: string;
	} = $props();

	let el = $state<HTMLDivElement | null>(null);
	let collapsed = $state(false);

	function toPx(length: string, node: HTMLElement): number {
		const n = Number.parseFloat(length);
		const fontSize = (x: Element) => Number.parseFloat(getComputedStyle(x).fontSize);
		if (length.endsWith('rem')) return n * fontSize(document.documentElement);
		if (length.endsWith('em')) return n * fontSize(node);
		return n;
	}

	$effect(() => {
		if (!collapseBelow || !el) {
			collapsed = false;
			return;
		}
		const node = el;
		const limit = toPx(collapseBelow, node);
		const ro = new ResizeObserver(([entry]) => {
			collapsed = entry.contentRect.width < limit;
		});
		ro.observe(node);
		return () => ro.disconnect();
	});

	const hasOverflow = $derived(!!items?.length || !!overflow);
</script>

<div
	bind:this={el}
	data-tsu="Toolbar"
	role="toolbar"
	aria-label={label}
	class="toolbar density-{density} {klass}"
	class:sticky
	class:collapsed
	data-collapsed={collapsed || undefined}
	style="--toolbar-top: {stickyOffset}; {styleProp}"
>
	{@render children()}
	{#if collapsed && hasOverflow}
		{#if items?.length}
			<Menu label={overflowLabel} {items} placement="bottom-end" box="sm">
				{#snippet trigger()}<IconButton icon="more" label={overflowLabel} box="sm" />{/snippet}
			</Menu>
		{:else if overflow}
			<Popover label={overflowLabel} placement="bottom-end" box="sm">
				{#snippet trigger()}<IconButton icon="more" label={overflowLabel} box="sm" />{/snippet}
				<div class="overflow-panel">{@render overflow()}</div>
			</Popover>
		{/if}
	{/if}
</div>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		flex-wrap: nowrap;
		gap: var(--sp-2);
		min-width: 0;
		container-type: inline-size;
	}
	.density-compact {
		gap: var(--sp-1);
	}
	.sticky {
		position: sticky;
		top: var(--toolbar-top, 0);
		z-index: calc(var(--z-header) - 1);
		background: var(--bg);
	}
	.collapsed :global([data-overflow]) {
		display: none;
	}
	.overflow-panel {
		display: flex;
		flex-direction: column;
		gap: var(--sp-1);
		padding: var(--sp-1);
	}
</style>
