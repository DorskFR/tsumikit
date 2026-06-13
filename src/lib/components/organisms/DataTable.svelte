<script lang="ts" module>
	export interface Column<T> {
		/** Key into the row, or an arbitrary id when paired with a cell snippet. */
		key: string;
		label: string;
		width?: string;
		align?: 'left' | 'center' | 'right';
		/** Pull a display value from the row (defaults to row[key]). */
		get?: (row: T) => unknown;
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
		cellSnippets = {},
		empty = 'No data.',
		stickyHeader = false
	}: {
		columns: Column<T>[];
		rows: T[];
		/** Stable key for each row (for keyed iteration). */
		rowKey: (row: T) => string | number;
		onrowclick?: (row: T) => void;
		cellSnippets?: Record<string, Snippet<[T]>>;
		empty?: string;
		stickyHeader?: boolean;
	} = $props();

	function display(col: Column<T>, row: T): unknown {
		if (col.get) return col.get(row);
		return (row as Record<string, unknown>)[col.key];
	}
</script>

<div class="dt-scroll">
	<table class="dt" class:sticky={stickyHeader}>
		<thead>
			<tr>
				{#each columns as col (col.key)}
					<th scope="col" style:width={col.width} style:text-align={col.align ?? 'left'}>
						{col.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if rows.length === 0}
				<tr>
					<td class="dt-empty" colspan={columns.length}>{empty}</td>
				</tr>
			{:else}
				{#each rows as row (rowKey(row))}
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
