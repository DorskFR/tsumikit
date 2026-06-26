<script lang="ts" module>
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
	}
</script>

<script lang="ts" generics="T">
	// Generic, accessible data table. Columns are typed against the row type; a
	// column renders row[key] by default, a `get` accessor, or a custom
	// `cellSnippets[key]` snippet for full control (badges, actions…). Sticky
	// header, empty state, optional row click (rows become buttons with the
	// right keyboard semantics). Horizontal scroll is contained so it never
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
		stickyHeader = false
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
		empty?: string;
		stickyHeader?: boolean;
	} = $props();

	let sortKey = $state<string | null>(null);
	let sortDir = $state<'asc' | 'desc'>('asc');

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

<div class="dt-scroll" data-tsu="DataTable">
	<table class="dt" class:sticky={stickyHeader}>
		<thead>
			<tr>
				{#each columns as col (col.key)}
					<th
						scope="col"
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
			</tr>
		</thead>
		<tbody>
			{#if sortedRows.length === 0}
				<tr>
					<td class="dt-empty" colspan={columns.length}>{empty}</td>
				</tr>
			{:else}
				{#each sortedRows as row (rowKey(row))}
					<tr
						class:clickable={!!onrowclick}
						tabindex={onrowclick ? 0 : undefined}
						role={onrowclick ? 'button' : undefined}
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
							<td style:text-align={col.align ?? 'left'}>
								{#if cellSnippets[col.key]}
									{@render cellSnippets[col.key](row)}
								{:else}
									{display(col, row)}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style>
	.dt-scroll {
		width: 100%;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		border: 1px solid var(--border);
		border-radius: var(--r-lg);
	}
	.dt {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--fs-sm);
		background: var(--surface);
	}
	th,
	td {
		padding: var(--sp-2) var(--sp-3);
		border-bottom: 1px solid var(--border);
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
		top: 0;
		z-index: 1;
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
	.dt-empty {
		text-align: center;
		color: var(--text-faint);
		padding: var(--sp-8);
	}
</style>
