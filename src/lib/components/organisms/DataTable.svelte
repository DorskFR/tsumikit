<script lang="ts" module>
	export type RowTone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';

	export interface Column<T> {
		/** Key into the row, or an arbitrary id when paired with a cell snippet. */
		key: string;
		label: string;
		width?: string;
		align?: 'left' | 'center' | 'right';
		/** Pull a display value from the row (defaults to row[key]). */
		get?: (row: T) => unknown;
		/** Header becomes a sort toggle. Sorts by the displayed value unless an
		 *  `onsort` handler is supplied (then the caller controls ordering). */
		sortable?: boolean;
		/** One-line cells clipped with an ellipsis (pair with `layout="fixed"`). */
		truncate?: boolean;
		nowrap?: boolean;
		/** Drop the column when the table's own box is narrower than the breakpoint
		 *  (sm 30rem, md 48rem, lg 64rem). */
		hideBelow?: 'sm' | 'md' | 'lg';
		/** Placement inside the stacked card (`responsive="stack"` only). Columns
		 *  without a role render as `label: value` detail lines. */
		role?: 'title' | 'detail' | 'meta' | 'actions' | 'hidden';
	}
</script>

<script lang="ts" generics="T">
	// Generic, accessible data table. Columns are typed against the row type; a
	// column renders row[key] by default, a `get` accessor, or a custom
	// `cellSnippets[key]` snippet for full control (badges, actions…). Sticky
	// header, empty state, optional row click (the table becomes a grid whose
	// rows are focusable and Enter/Space-activatable; rows stay rows for AT). Horizontal scroll is contained so it never
	// breaks the page layout on mobile.
	import type { Snippet } from 'svelte';

	let {
		columns,
		rows,
		rowKey,
		onrowclick,
		onsort,
		cellSnippets = {},
		empty = 'No data.',
		stickyHeader = false,
		stickyOffset,
		layout = 'auto',
		hideHeader = false,
		size = 'md',
		rowTone,
		rowClass,
		rowActions,
		rowActionsLabel = 'Actions',
		loading = false,
		loadingLabel = 'Loading…',
		onloadmore,
		loadMoreLabel = 'Load more',
		responsive = 'scroll',
		stackBelow = '48rem',
		class: klass = '',
		style: styleProp = '',
		tableClass = '',
	}: {
		columns: Column<T>[];
		rows: T[];
		/** Stable key for each row (for keyed iteration). */
		rowKey: (row: T) => string | number;
		onrowclick?: (row: T) => void;
		/** Supply to take over ordering (server-side / custom sort). When set, the
		 *  table only reflects the indicator and emits; it does not reorder rows. */
		onsort?: (key: string, dir: 'asc' | 'desc') => void;
		cellSnippets?: Record<string, Snippet<[T]>>;
		empty?: string | Snippet;
		stickyHeader?: boolean;
		/** Distance from the scroll container's top for the sticky header, e.g.
		 *  `var(--header-h)` when the page header overlaps. Defaults to 0. */
		stickyOffset?: string;
		/** `fixed` makes declared column widths authoritative (needed for truncate). */
		layout?: 'auto' | 'fixed';
		/** Visually hides the header; it stays in the DOM for assistive tech. */
		hideHeader?: boolean;
		size?: 'sm' | 'md';
		/** Per-row semantic tone, rendered as a left accent bar + `data-tone`. */
		rowTone?: (row: T) => RowTone | undefined;
		rowClass?: (row: T) => string | undefined;
		/** Trailing actions cell revealed on hover/focus (always visible on touch). */
		rowActions?: Snippet<[T]>;
		rowActionsLabel?: string;
		loading?: boolean;
		loadingLabel?: string;
		/** Renders a footer "load more" button that calls this. */
		onloadmore?: () => void;
		loadMoreLabel?: string;
		/** `stack` renders each row as a card once the table's own box is narrower
		 *  than `stackBelow`; `scroll` (default) keeps a horizontal scroller. */
		responsive?: 'scroll' | 'stack';
		/** Width (px/em/rem) under which `stack` mode kicks in. */
		stackBelow?: string;
		class?: string;
		style?: string;
		/** Class on the inner <table>. */
		tableClass?: string;
	} = $props();

	let wrapEl = $state<HTMLDivElement | null>(null);
	let stacked = $state(false);
	let actionsW = $state(0);

	function measureActions(node: HTMLElement) {
		const update = () => {
			actionsW = Math.max(actionsW, Math.ceil(node.getBoundingClientRect().width));
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(node);
		return { destroy: () => observer.disconnect() };
	}

	function toPx(length: string, el: HTMLElement): number {
		const n = Number.parseFloat(length);
		const fontSize = (node: Element) => Number.parseFloat(getComputedStyle(node).fontSize);
		if (length.endsWith('rem')) return n * fontSize(document.documentElement);
		if (length.endsWith('em')) return n * fontSize(el);
		return n;
	}

	$effect(() => {
		if (responsive !== 'stack' || !wrapEl) {
			stacked = false;
			return;
		}
		const el = wrapEl;
		const limit = toPx(stackBelow, el);
		const observer = new ResizeObserver(([entry]) => {
			stacked = entry.contentRect.width < limit;
		});
		observer.observe(el);
		return () => observer.disconnect();
	});

	let sortKey = $state<string | null>(null);
	let sortDir = $state<'asc' | 'desc'>('asc');

	const colCount = $derived(columns.length + (rowActions ? 1 : 0));

	function display(col: Column<T>, row: T): unknown {
		if (col.get) return col.get(row);
		return (row as Record<string, unknown>)[col.key];
	}

	function toggleSort(col: Column<T>) {
		if (!col.sortable) return;
		if (sortKey === col.key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else {
			sortKey = col.key;
			sortDir = 'asc';
		}
		onsort?.(col.key, sortDir);
	}

	// Internal sort (skipped when the caller owns ordering via `onsort`).
	const sortedRows = $derived.by(() => {
		if (onsort || !sortKey) return rows;
		const col = columns.find((c) => c.key === sortKey);
		if (!col) return rows;
		const dir = sortDir === 'asc' ? 1 : -1;
		return [...rows].sort((a, b) => {
			const av = display(col, a);
			const bv = display(col, b);
			if (av == null) return bv == null ? 0 : 1;
			if (bv == null) return -1;
			if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
			return String(av).localeCompare(String(bv)) * dir;
		});
	});
</script>

<div
	bind:this={wrapEl}
	class="dt-scroll {klass}"
	style={styleProp}
	class:dt-stack={responsive === 'stack'}
	data-tsu="DataTable"
	data-size={size}
	data-stacked={stacked || undefined}
	aria-busy={loading || undefined}
>
	<table
		class="dt {tableClass}"
		class:sticky={stickyHeader}
		class:fixed={layout === 'fixed'}
		class:head-hidden={hideHeader}
		class:sm={size === 'sm'}
		style:--dt-sticky-offset={stickyOffset}
		style:--dt-actions-w={actionsW ? `calc(${actionsW}px + 2 * var(--sp-3))` : undefined}
		role={onrowclick ? 'grid' : undefined}
	>
		<thead data-part="head">
			<tr>
				{#each columns as col (col.key)}
					<th
						scope="col"
						data-hide-below={col.hideBelow}
						style:width={col.width}
						style:text-align={col.align ?? 'left'}
						aria-sort={col.sortable
							? sortKey === col.key
								? sortDir === 'asc'
									? 'ascending'
									: 'descending'
								: 'none'
							: undefined}
					>
						{#if col.sortable}
							<button type="button" class="dt-sort" onclick={() => toggleSort(col)}>
								<span>{col.label}</span>
								<span class="dt-arrow" class:active={sortKey === col.key}>
									{sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
								</span>
							</button>
						{:else}
							{col.label}
						{/if}
					</th>
				{/each}
				{#if rowActions}
					<th scope="col" class="dt-actions-head"><span class="sr-only">{rowActionsLabel}</span></th>
				{/if}
			</tr>
		</thead>
		<tbody>
			{#if sortedRows.length === 0 && !loading}
				<tr data-part="empty">
					<td class="dt-empty" colspan={colCount}>
						{#if typeof empty === 'string'}
							{empty}
						{:else}
							{@render empty()}
						{/if}
					</td>
				</tr>
			{:else}
				{#each sortedRows as row (rowKey(row))}
					{@const tone = rowTone?.(row)}
					<tr
						data-part="row"
						data-tone={tone}
						class={rowClass?.(row)}
						class:clickable={!!onrowclick}
						class:toned={!!tone && tone !== 'neutral'}
						tabindex={onrowclick ? 0 : undefined}
						onclick={onrowclick ? () => onrowclick(row) : undefined}
						onkeydown={onrowclick
							? (e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onrowclick(row);
									}
								}
							: undefined}
					>
						{#each columns as col (col.key)}
							<td
								data-part="cell"
								data-hide-below={col.hideBelow}
								data-role={responsive === 'stack' ? (col.role ?? 'detail') : undefined}
								data-label={responsive === 'stack' ? col.label : undefined}
								class:truncate={col.truncate}
								class:nowrap={col.nowrap}
								style:text-align={stacked ? undefined : (col.align ?? 'left')}
							>
								{#if cellSnippets[col.key]}
									{@render cellSnippets[col.key](row)}
								{:else}
									{display(col, row)}
								{/if}
							</td>
						{/each}
						{#if rowActions}
							<td data-part="actions" class="dt-actions">
								<span class="dt-actions-inner" use:measureActions>{@render rowActions(row)}</span>
							</td>
						{/if}
					</tr>
				{/each}
			{/if}
			{#if loading}
				<tr data-part="loading">
					<td class="dt-empty" colspan={colCount}>{loadingLabel}</td>
				</tr>
			{/if}
		</tbody>
		{#if onloadmore && !loading}
			<tfoot>
				<tr>
					<td class="dt-more" colspan={colCount}>
						<button type="button" class="dt-more-btn" onclick={onloadmore}>{loadMoreLabel}</button>
					</td>
				</tr>
			</tfoot>
		{/if}
	</table>
</div>

<style>
	.dt-scroll {
		width: 100%;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		border: 1px solid var(--border);
		border-radius: var(--r-lg);
		container-type: inline-size;
	}
	.dt {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--fs-sm);
		background: var(--surface);
	}
	.dt.fixed {
		table-layout: fixed;
	}
	.dt.sm {
		font-size: var(--fs-xs);
	}
	th,
	td {
		padding: var(--sp-2) var(--sp-3);
		border-bottom: 1px solid var(--border);
	}
	.dt.sm th,
	.dt.sm td {
		padding: var(--sp-1) var(--sp-2);
	}
	th {
		font-size: var(--fs-xs);
		font-weight: var(--fw-semibold);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: var(--bg-elevated-2);
		white-space: nowrap;
	}
	.dt.sticky th {
		position: sticky;
		top: var(--dt-sticky-offset, 0);
		z-index: 1;
	}
	/* Header stays in flow (so widths still apply) but paints nothing. */
	.dt.head-hidden th {
		height: 0;
		padding: 0;
		border: 0;
		line-height: 0;
		overflow: hidden;
		clip-path: inset(50%);
	}
	.dt.head-hidden th > * {
		display: block;
		height: 0;
		overflow: hidden;
	}
	/* Sort toggle: a bare button that inherits the th's type styling. */
	.dt-sort {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		border: 0;
		background: none;
		padding: 0;
		font: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
		color: inherit;
		cursor: pointer;
	}
	.dt-sort:hover {
		color: var(--text);
	}
	.dt-arrow {
		opacity: 0.4;
		font-size: 0.9em;
	}
	.dt-arrow.active {
		opacity: 1;
		color: var(--accent);
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	tr.clickable {
		cursor: pointer;
		transition: background 0.12s var(--ease);
	}
	tr.clickable:hover,
	tr.clickable:focus-visible {
		background: var(--bg-elevated-2);
		outline: none;
	}
	td.truncate {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 0;
	}
	td.nowrap {
		white-space: nowrap;
	}
	tr[data-tone='ok'] {
		--dt-tone: var(--ok);
	}
	tr[data-tone='warn'] {
		--dt-tone: var(--warn);
	}
	tr[data-tone='danger'] {
		--dt-tone: var(--danger);
	}
	tr[data-tone='info'] {
		--dt-tone: var(--info);
	}
	tr.toned td:first-child {
		box-shadow: inset 3px 0 0 var(--dt-tone);
	}
	.dt-actions-head,
	.dt-actions {
		width: 1%;
		white-space: nowrap;
		text-align: right;
	}
	.dt.fixed .dt-actions-head,
	.dt.fixed .dt-actions {
		width: var(--dt-actions-w, 3.5rem);
	}
	.dt-actions {
		opacity: 0;
		transition: opacity 0.12s var(--ease);
	}
	.dt-actions-inner {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		white-space: nowrap;
	}
	tr:hover .dt-actions,
	tr:focus-within .dt-actions {
		opacity: 1;
	}
	@media (pointer: coarse) {
		.dt-actions {
			opacity: 1;
		}
	}
	@container (max-width: 30rem) {
		[data-hide-below='sm'] {
			display: none;
		}
	}
	@container (max-width: 48rem) {
		[data-hide-below='md'] {
			display: none;
		}
	}
	@container (max-width: 64rem) {
		[data-hide-below='lg'] {
			display: none;
		}
	}
	/* Stacked cards: the <table> stays a table for AT, but every row lays out as
	   a wrapping flex row (title | actions, detail lines, trailing meta cluster).
	   The header is clipped, not removed. */
	[data-stacked] {
		overflow-x: visible;
	}
	[data-stacked] thead {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	[data-stacked] tbody,
	[data-stacked] tfoot,
	[data-stacked] td {
		display: block;
	}
	[data-stacked] tbody tr,
	[data-stacked] tfoot tr {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--sp-1) var(--sp-3);
		padding: var(--sp-3);
		border-bottom: 1px solid var(--border);
	}
	[data-stacked] tbody tr:last-child {
		border-bottom: none;
	}
	[data-stacked] td {
		flex: 0 0 100%;
		min-width: 0;
		padding: 0;
		border: 0;
	}
	[data-stacked] td.truncate {
		max-width: none;
	}
	[data-stacked] tr.toned td:first-child {
		box-shadow: none;
	}
	[data-stacked] tr.toned {
		box-shadow: inset 3px 0 0 var(--dt-tone);
	}
	[data-stacked] td[data-role='title'] {
		flex: 1 1 auto;
		min-width: min(100%, 12rem);
		order: -2;
		font-weight: var(--fw-semibold);
		font-size: var(--fs-md);
		color: var(--text);
	}
	[data-stacked] td[data-role='detail']::before {
		content: attr(data-label) ': ';
		color: var(--text-muted);
	}
	[data-stacked] td[data-role='meta'] {
		flex: none;
		order: 1;
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		color: var(--text-muted);
	}
	[data-stacked] td[data-role='meta']::before {
		content: attr(data-label) ' ';
		color: var(--text-faint);
	}
	[data-stacked] td[data-role='actions'],
	[data-stacked] td.dt-actions {
		flex: none;
		order: -1;
		margin-inline-start: auto;
		width: auto;
		opacity: 1;
	}
	[data-stacked] td[data-role='hidden'] {
		display: none;
	}
	[data-stacked] td.dt-empty,
	[data-stacked] td.dt-more {
		text-align: center;
	}
	.dt-empty {
		text-align: center;
		color: var(--text-faint);
		padding: var(--sp-8);
	}
	.dt-more {
		text-align: center;
		padding: var(--sp-2);
		border-top: 1px solid var(--border);
	}
	.dt-more-btn {
		border: 0;
		background: none;
		padding: var(--sp-1) var(--sp-3);
		font: inherit;
		color: var(--accent);
		cursor: pointer;
		border-radius: var(--r-md, 6px);
	}
	.dt-more-btn:hover,
	.dt-more-btn:focus-visible {
		background: var(--bg-elevated-2);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
