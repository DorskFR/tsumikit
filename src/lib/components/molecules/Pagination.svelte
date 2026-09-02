<script lang="ts">
	// Page navigation in two flavours: page mode (`page` + `pageCount`) or
	// offset mode (`offset` + `limit` + `total`, page/pageCount derived and
	// `offset` written back). Numbered buttons collapse to prev / "3 / 12" /
	// next when the container is narrower than 24rem.
	import Text from '$lib/components/atoms/Text.svelte';
	import IconButton from './IconButton.svelte';

	let {
		page = $bindable(1),
		pageCount,
		offset = $bindable(),
		limit,
		total,
		onchange,
		siblings = 1,
		showEdges = true,
		showRange = false,
		size = 'md',
		label = 'Pagination',
		class: klass = ''
	}: {
		/** 1-based current page. */
		page?: number;
		pageCount?: number;
		/** Offset mode: 0-based index of the first item; needs `limit` + `total`. */
		offset?: number;
		limit?: number;
		total?: number;
		onchange?: (page: number) => void;
		/** Numbered pages shown on each side of the current one. */
		siblings?: number;
		/** Always show the first and last page. */
		showEdges?: boolean;
		/** Show "1–20 / 412" (offset mode) or "3 / 12" next to the buttons. */
		showRange?: boolean;
		size?: 'sm' | 'md';
		label?: string;
		class?: string;
	} = $props();

	const offsetMode = $derived(offset !== undefined && limit !== undefined && total !== undefined);
	const count = $derived(
		Math.max(
			1,
			offsetMode ? Math.ceil((total as number) / Math.max(1, limit as number)) : (pageCount ?? 1)
		)
	);
	const current = $derived(
		Math.min(
			count,
			Math.max(
				1,
				offsetMode ? Math.floor((offset as number) / Math.max(1, limit as number)) + 1 : page
			)
		)
	);

	const ELLIPSIS = -1;
	const items = $derived.by((): number[] => {
		const out: number[] = [];
		const lo = Math.max(1, current - siblings);
		const hi = Math.min(count, current + siblings);
		if (showEdges && lo > 1) {
			out.push(1);
			if (lo > 2) out.push(ELLIPSIS);
		}
		for (let p = lo; p <= hi; p++) out.push(p);
		if (showEdges && hi < count) {
			if (hi < count - 1) out.push(ELLIPSIS);
			out.push(count);
		}
		return out;
	});

	const rangeText = $derived.by(() => {
		if (offsetMode) {
			const t = total as number;
			const from = t === 0 ? 0 : (current - 1) * (limit as number) + 1;
			const to = Math.min(t, current * (limit as number));
			return `${from}–${to} / ${t}`;
		}
		return `${current} / ${count}`;
	});

	function go(p: number) {
		const next = Math.min(count, Math.max(1, p));
		if (next === current) return;
		page = next;
		if (offsetMode) offset = (next - 1) * (limit as number);
		onchange?.(next);
	}
</script>

<nav
	data-tsu="Pagination"
	class="pagination {klass}"
	class:pagination-sm={size === 'sm'}
	aria-label={label}
>
	<IconButton
		icon="chevron-left"
		label="Previous page"
		box={size === 'sm' ? 'sm' : 'md'}
		disabled={current <= 1}
		onclick={() => go(current - 1)}
	/>
	<ol class="pages">
		{#each items as item, i (item === ELLIPSIS ? `e${i}` : item)}
			<li>
				{#if item === ELLIPSIS}
					<span class="ellipsis" aria-hidden="true">…</span>
				{:else}
					<button
						type="button"
						class="page"
						class:on={item === current}
						aria-current={item === current ? 'page' : undefined}
						aria-label="Page {item}"
						onclick={() => go(item)}
					>
						{item}
					</button>
				{/if}
			</li>
		{/each}
	</ol>
	<Text class="compact" size="sm" numeric tone="muted" aria-live="polite">{current} / {count}</Text>
	<IconButton
		icon="chevron-right"
		label="Next page"
		box={size === 'sm' ? 'sm' : 'md'}
		disabled={current >= count}
		onclick={() => go(current + 1)}
	/>
	{#if showRange}
		<Text class="range" size="sm" numeric tone="muted">{rangeText}</Text>
	{/if}
</nav>

<style>
	.pagination {
		container-type: inline-size;
		display: flex;
		align-items: center;
		gap: var(--sp-1);
		flex-wrap: wrap;
	}
	.pages {
		display: flex;
		align-items: center;
		gap: var(--sp-1);
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.page {
		min-width: var(--box-md);
		height: var(--box-md);
		padding: 0 var(--sp-2);
		border: 1px solid transparent;
		border-radius: 999px;
		background: transparent;
		color: var(--text-muted);
		font-size: var(--fs-sm);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
		transition:
			background 0.12s var(--ease),
			color 0.12s var(--ease);
	}
	.page:hover {
		background: var(--bg-elevated-2);
		color: var(--text);
	}
	.page.on {
		background: color-mix(in srgb, var(--accent) 16%, transparent);
		border-color: color-mix(in srgb, var(--accent) 50%, transparent);
		color: var(--accent);
		font-weight: var(--fw-semibold);
	}
	.pagination-sm .page {
		min-width: var(--box-sm);
		height: var(--box-sm);
		font-size: var(--fs-xs);
	}
	.ellipsis {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--box-md);
		color: var(--text-faint);
	}
	.pagination :global(.compact) {
		display: none;
		padding: 0 var(--sp-2);
	}
	.pagination :global(.range) {
		margin-left: var(--sp-2);
	}
	@container (max-width: 24rem) {
		.pages {
			display: none;
		}
		.pagination :global(.compact) {
			display: inline;
		}
	}
</style>
