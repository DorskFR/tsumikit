<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface GlyphStackItem {
		/** Rendered in the inline run, and in the grid when `stacked` is unset. */
		inline: Snippet | string;
		/** Compact variant for a 1rem grid cell (e.g. a tinted initial tile for a full Badge). */
		stacked?: Snippet | string;
	}
</script>

<script lang="ts">
	// Up to four small glyphs (pin, status dot, entity tag, avatar) as an inline
	// run, folded into one 2×2 grid of 1rem cells when the row is tight. The grid
	// is purely visual: DOM order, focus order and reading order never change.
	import type { HTMLAttributes } from 'svelte/elements';
	import { browser } from '$lib/env';

	type Own = {
		/** Glyphs as `{ inline, stacked? }` pairs; alternative to `children`. */
		items?: GlyphStackItem[];
		/** Free-form run — each direct child becomes a cell. */
		children?: Snippet;
		/** `auto` folds below `stackBelow`, measured on the nearest query container
		 *  (any `.cq`, an AppShell region, or the ancestor named `container`). */
		stack?: 'never' | 'always' | 'auto';
		/** Container width (px/em/rem) under which `auto` folds. */
		stackBelow?: string;
		/** `container-name` of the ancestor to measure instead of the nearest one. */
		container?: string;
		class?: string;
	};
	let {
		items,
		children,
		stack = 'auto',
		stackBelow = '30rem',
		container,
		class: klass = '',
		...rest
	}: Omit<HTMLAttributes<HTMLSpanElement>, keyof Own> & Own = $props();

	let root = $state<HTMLElement>();
	let width = $state(Number.POSITIVE_INFINITY);
	let limit = $state(0);
	const stacked = $derived(stack === 'always' || (stack === 'auto' && width < limit));

	function toPx(length: string, el: HTMLElement): number {
		const n = Number.parseFloat(length);
		const fontSize = (node: Element) => Number.parseFloat(getComputedStyle(node).fontSize);
		if (length.endsWith('rem')) return n * fontSize(document.documentElement);
		if (length.endsWith('em')) return n * fontSize(el);
		return n;
	}

	function queryContainer(el: HTMLElement, name?: string): HTMLElement | null {
		for (let node = el.parentElement; node; node = node.parentElement) {
			const style = getComputedStyle(node);
			if (name) {
				if (style.containerName?.split(/\s+/).includes(name)) return node;
			} else if (style.containerType && style.containerType !== 'normal') {
				return node;
			}
		}
		return el.parentElement;
	}

	$effect(() => {
		if (!browser || !root || stack !== 'auto') return;
		const el = root;
		const target = queryContainer(el, container);
		if (!target) return;
		limit = toPx(stackBelow, el);
		const observer = new ResizeObserver(([entry]) => {
			width = entry.contentRect.width;
		});
		observer.observe(target);
		return () => observer.disconnect();
	});
</script>

<span
	bind:this={root}
	data-tsu="GlyphStack"
	class="glyph-stack {klass}"
	class:stacked
	data-stack={stack}
	data-stacked={stacked || undefined}
	{...rest}
>
	{#if items}
		{#each items.slice(0, 4) as item, i (i)}
			{@const glyph = stacked && item.stacked !== undefined ? item.stacked : item.inline}
			<span class="cell">
				{#if typeof glyph === 'string'}{glyph}{:else}{@render glyph()}{/if}
			</span>
		{/each}
	{:else}
		{@render children?.()}
	{/if}
</span>

<style>
	.glyph-stack {
		display: inline-flex;
		align-items: center;
		gap: var(--glyph-stack-gap, var(--sp-1));
		flex: none;
		vertical-align: middle;
	}
	.cell {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
	}
	.stacked {
		display: inline-grid;
		grid-template-columns: repeat(2, 1rem);
		grid-auto-rows: 1rem;
		gap: 1px;
		place-items: center;
	}
	.stacked > :global(*) {
		width: 1rem;
		height: 1rem;
		max-width: 1rem;
		max-height: 1rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		font-size: var(--fs-xs);
		line-height: 1;
	}
</style>
