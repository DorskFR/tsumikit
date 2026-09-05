<script lang="ts">
	// List + detail columns. Above `breakpoint` (measured on this component's own
	// box, not the viewport) both columns render and scroll independently. Below
	// it exactly one pane renders: the list while nothing is `selected`, the
	// detail (with a sticky back header) once it is. The consumer drives
	// `selected` — typically from the URL — so each pane can be its own route.
	import type { Snippet } from 'svelte';
	import { browser } from '$lib/env';
	import Icon from '$lib/components/atoms/Icon.svelte';

	let {
		list,
		detail,
		detailHeader,
		empty,
		listWidth = '17rem',
		breakpoint = '48rem',
		selected = false,
		onback,
		backLabel = 'Back',
		listLabel = 'List',
		class: klass = '',
		style,
		...rest
	}: {
		list: Snippet;
		detail: Snippet;
		/** Rendered above the detail; on mobile it shares the sticky header with the back button. */
		detailHeader?: Snippet;
		/** Desktop placeholder in the detail column while nothing is selected. */
		empty?: Snippet;
		listWidth?: string;
		/** Own-width threshold (px/em/rem) below which the panes become two pages. */
		breakpoint?: string;
		selected?: boolean;
		onback?: () => void;
		backLabel?: string;
		listLabel?: string;
		class?: string;
		style?: string;
		[key: string]: unknown;
	} = $props();

	let root = $state<HTMLElement | null>(null);
	let mobile = $state(false);

	function toPx(length: string, el: HTMLElement): number {
		const n = Number.parseFloat(length);
		const fontSize = (node: Element) => Number.parseFloat(getComputedStyle(node).fontSize);
		if (length.endsWith('rem')) return n * fontSize(document.documentElement);
		if (length.endsWith('em')) return n * fontSize(el);
		return n;
	}

	$effect(() => {
		if (!browser || !root) return;
		const el = root;
		const limit = toPx(breakpoint, el);
		const observer = new ResizeObserver(([entry]) => {
			mobile = entry.contentRect.width < limit;
		});
		observer.observe(el);
		return () => observer.disconnect();
	});

	const showList = $derived(!mobile || !selected);
	const showDetail = $derived(!mobile || selected);
</script>

<div
	bind:this={root}
	class="md {klass}"
	class:mobile
	class:selected
	style="--md-list-w: {listWidth};{style ? ` ${style}` : ''}"
	data-tsu="MasterDetail"
	{...rest}
>
	{#if showList}
		<aside class="md-list" aria-label={listLabel}>
			{@render list()}
		</aside>
	{/if}
	{#if showDetail}
		<section class="md-detail">
			{#if mobile}
				<header class="md-detail-header">
					<button type="button" class="md-back" onclick={() => onback?.()}>
						<Icon name="chevron-left" />
						<span>{backLabel}</span>
					</button>
					{#if detailHeader}
						<div class="md-detail-header-content">{@render detailHeader()}</div>
					{/if}
				</header>
			{:else if detailHeader}
				<header class="md-detail-header">
					<div class="md-detail-header-content">{@render detailHeader()}</div>
				</header>
			{/if}
			<div class="md-detail-body">
				{#if selected}
					{@render detail()}
				{:else}
					{@render empty?.()}
				{/if}
			</div>
		</section>
	{/if}
</div>

<style>
	.md {
		display: grid;
		grid-template-columns: var(--md-list-w) minmax(0, 1fr);
		min-width: 0;
		min-height: 0;
		height: 100%;
		overflow: hidden;
	}
	.md-list,
	.md-detail {
		min-width: 0;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
	}
	.md-list {
		border-right: 1px solid var(--border);
	}
	.md-detail {
		display: flex;
		flex-direction: column;
	}
	.md-detail-header {
		position: sticky;
		top: 0;
		z-index: var(--z-header);
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
		min-height: var(--touch-target);
		padding-inline: var(--sp-3);
		background: color-mix(in srgb, var(--bg) 88%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--border);
	}
	.md-detail-header-content {
		flex: 1;
		min-width: 0;
	}
	.md-detail-body {
		flex: 1;
		min-height: 0;
	}
	.md-back {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		min-height: var(--touch-target);
		min-width: var(--touch-target);
		padding-inline: var(--sp-2);
		margin-inline-start: calc(-1 * var(--sp-2));
		border: 0;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--accent);
		font: inherit;
		font-size: var(--fs-sm);
		font-weight: var(--fw-medium);
		cursor: pointer;
		flex-shrink: 0;
	}
	.md-back:hover {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}
	.md-back:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.md.mobile {
		grid-template-columns: minmax(0, 1fr);
	}
	.md.mobile .md-list {
		border-right: 0;
		width: 100%;
		padding-inline: var(--safe-left) var(--safe-right);
		padding-bottom: var(--safe-bottom);
	}
	.md.mobile .md-detail {
		width: 100%;
		animation: md-slide-in 0.2s var(--ease);
	}
	.md.mobile .md-detail-header {
		padding-inline: max(var(--sp-3), var(--safe-left)) max(var(--sp-3), var(--safe-right));
	}
	.md.mobile .md-detail-body {
		padding-inline: var(--safe-left) var(--safe-right);
		padding-bottom: var(--safe-bottom);
	}

	@keyframes md-slide-in {
		from {
			transform: translateX(8%);
			opacity: 0;
		}
		to {
			transform: none;
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.md.mobile .md-detail {
			animation: none;
		}
	}
</style>
