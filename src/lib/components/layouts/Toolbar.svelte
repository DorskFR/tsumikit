<script lang="ts">
	// Horizontal action bar. Below `collapseBelow` (measured on the bar's own box)
	// every child marked `data-overflow` is hidden and a `…` button opens a Menu
	// with `items` (or the `overflow` snippet in a Popover) that stands in for
	// them. `sticky` pins the bar under `stickyOffset`.
	//
	// `role="toolbar"` is a promise of keyboard behaviour, so the bar keeps it:
	// roving tabindex makes it one tab stop and ←/→/Home/End move between the
	// controls actually visible, the `…` trigger included. Children are arbitrary
	// snippet content, so the ring is read from the DOM rather than a list prop.
	import type { Snippet } from 'svelte';
	import IconButton from '$lib/components/molecules/IconButton.svelte';
	import Menu, { type MenuItem } from '$lib/components/molecules/Menu.svelte';
	import Popover from '$lib/components/molecules/Popover.svelte';
	import {
		consumesArrowKeys,
		isToolbarNavKey,
		nextToolbarStop,
		TOOLBAR_STOP_ATTR,
		toolbarStops
	} from './toolbar-roving.js';

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
		roving = true,
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
		/** Roving tabindex: the bar is one tab stop and ←/→ (plus Home/End) move
		 *  between its controls. `false` drops `role="toolbar"` along with the
		 *  keyboard contract it promises, leaving children as ordinary tab stops. */
		roving?: boolean;
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

	let activeStop: HTMLElement | null = null;

	// Collapsed `data-overflow` children are `display: none`, so they have no box —
	// that, not a class check, is what takes them out of the ring.
	const stops = () => toolbarStops(el, (node) => node.getClientRects().length === 0);

	function rove(list: HTMLElement[], index: number) {
		activeStop = list[index] ?? null;
		list.forEach((node, i) => {
			node.setAttribute(TOOLBAR_STOP_ATTR, '');
			node.tabIndex = i === index ? 0 : -1;
		});
	}

	function sync() {
		const list = stops();
		if (!list.length) return;
		const current = activeStop ? list.indexOf(activeStop) : -1;
		rove(list, current < 0 ? 0 : current);
	}

	$effect(() => {
		if (!roving || !el) return;
		const node = el;
		sync();
		// Only attributes the caller owns are observed: writing tabindex and
		// TOOLBAR_STOP_ATTR back must not re-enter this.
		const mo = new MutationObserver(sync);
		mo.observe(node, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['disabled', 'hidden', 'aria-hidden', 'class', 'style']
		});
		return () => mo.disconnect();
	});

	function onKeydown(event: KeyboardEvent) {
		if (!roving || event.defaultPrevented) return;
		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		if (!isToolbarNavKey(event.key)) return;
		const target = event.target as HTMLElement | null;
		if (consumesArrowKeys(target)) return;
		const list = stops();
		const next = nextToolbarStop(
			list.length,
			list.findIndex((node) => node.contains(target)),
			event.key
		);
		if (next === undefined) return;
		event.preventDefault();
		rove(list, next);
		list[next].focus();
	}

	function onFocusin(event: FocusEvent) {
		if (!roving) return;
		const list = stops();
		const index = list.findIndex((node) => node.contains(event.target as Node));
		if (index >= 0 && list[index] !== activeStop) rove(list, index);
	}
</script>

<div
	bind:this={el}
	data-tsu="Toolbar"
	role={roving ? 'toolbar' : undefined}
	aria-label={roving ? label : undefined}
	onkeydown={onKeydown}
	onfocusin={onFocusin}
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
