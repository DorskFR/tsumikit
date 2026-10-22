<script lang="ts">
	// List + detail columns. Above `breakpoint` (measured on this component's own
	// box, not the viewport) both columns render and scroll independently. Below
	// it exactly one pane shows: the list while nothing is `selected`, the detail
	// (with a sticky back header) once it is. Both stay mounted, so the list keeps
	// its scroll and the focus moves to Back and returns to the opened item.
	// The consumer drives `selected` — typically from the URL — so each pane can
	// be its own route.
	import { type Snippet, tick } from 'svelte';
	import { browser } from '$lib/env';
	import Icon from '$lib/components/atoms/Icon.svelte';

	let {
		list,
		detail,
		detailHeader,
		empty,
		listWidth = '17rem',
		breakpoint = '48rem',
		gap = '0',
		divider = 'border',
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
		/** Space between the two columns (any CSS length). */
		gap?: string;
		/** Seam between the panes; `--md-divider` overrides it with any border shorthand. */
		divider?: 'border' | 'none';
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
	let listEl = $state<HTMLElement | null>(null);
	let backEl = $state<HTMLButtonElement | null>(null);
	let listScroll = 0;
	let listFocus: HTMLElement | null = null;
	let wasSelected: boolean | undefined;

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

	$effect.pre(() => {
		const now = selected;
		const prev = wasSelected;
		wasSelected = now;
		if (!mobile || prev === undefined || prev === now) return;
		const list = listEl;
		if (now) {
			listScroll = list?.scrollTop ?? 0;
			const active = document.activeElement;
			listFocus = active instanceof HTMLElement && list?.contains(active) ? active : null;
			tick().then(() => backEl?.focus());
		} else {
			tick().then(() => {
				if (list) list.scrollTop = listScroll;
				if (listFocus?.isConnected) listFocus.focus({ preventScroll: true });
				listFocus = null;
			});
		}
	});
</script>

<div
	bind:this={root}
	class="md {klass}"
	class:mobile
	class:selected
	style="--md-list-w: {listWidth}; --md-gap: {gap}; --md-divider: {divider === 'none'
		? 'none'
		: 'var(--edge-width) solid var(--surface-edge)'};{style ? ` ${style}` : ''}"
	data-tsu="MasterDetail"
	{...rest}
>
	<aside bind:this={listEl} class="md-list" aria-label={listLabel} hidden={!showList}>
		{@render list()}
	</aside>
	<section class="md-detail" hidden={!showDetail}>
		{#if mobile}
			<header class="md-detail-header">
				<button bind:this={backEl} type="button" class="md-back" onclick={() => onback?.()}>
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
</div>

<style>
	.md {
		display: grid;
		grid-template-columns: var(--md-list-w) minmax(0, 1fr);
		gap: var(--md-gap, 0);
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
		border-right: var(--md-divider, var(--edge-width) solid var(--surface-edge));
	}
	.md-detail {
		display: flex;
		flex-direction: column;
	}
	.md-detail[hidden] {
		display: none;
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
		border-bottom: var(--edge-width) solid var(--surface-edge);
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
	@media (hover: hover) and (pointer: fine) {
		.md-back:hover {
			background: color-mix(in srgb, var(--accent) 12%, transparent);
		}
	}
	.md-back:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset-inset);
	}

	.md.mobile {
		grid-template-columns: minmax(0, 1fr);
		gap: 0;
	}
	.md.mobile .md-list {
		border-right: 0;
		width: 100%;
		padding-inline: var(--safe-left) var(--safe-right);
		padding-bottom: var(--safe-bottom);
	}
	.md.mobile .md-detail {
		width: 100%;
		translate: 0 0;
		opacity: 1;
		transition:
			translate var(--dur-base) var(--ease-out),
			opacity var(--dur-base) var(--ease-out),
			display var(--dur-base) allow-discrete;
	}
	@starting-style {
		.md.mobile .md-detail {
			translate: var(--shift-md) 0;
			opacity: 0;
		}
	}
	.md.mobile .md-detail[hidden] {
		translate: var(--shift-md) 0;
		opacity: 0;
		transition-duration: var(--dur-exit);
	}
	.md.mobile .md-detail-header {
		padding-inline: max(var(--sp-3), var(--safe-left)) max(var(--sp-3), var(--safe-right));
	}
	.md.mobile .md-detail-body {
		padding-inline: var(--safe-left) var(--safe-right);
		padding-bottom: var(--safe-bottom);
	}
</style>
