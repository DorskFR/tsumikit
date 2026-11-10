<script lang="ts" module>
	import type { IconName } from '$lib/components/atoms/Icon.svelte';

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
		/** `false` drops the stacked label: meta cells join on one `·` line and
		 *  detail cells share lines (`responsive="stack"` only, default true). */
		stackLabel?: boolean;
	}

	export interface RowAction {
		id: string;
		/** Accessible name and tooltip of the inline button; the menu row text. */
		label: string;
		icon?: IconName;
		onselect: () => void;
		danger?: boolean;
		disabled?: boolean;
	}

	const SELECT_ACTION_ID = '__select';
	// Layers that consume Escape themselves; the selection bar is a popover too.
	const OWN_ESCAPE = 'dialog, [popover]:not([data-part="selection-bar"])';
	const SKELETON_WIDTHS = ['72%', '48%', '64%', '40%', '80%', '56%'];

	let rootFontPx: number | undefined;

	function rootFontSize(): number {
		if (rootFontPx === undefined) {
			rootFontPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
			window.addEventListener('resize', () => (rootFontPx = undefined), { once: true });
		}
		return rootFontPx;
	}
</script>

<script lang="ts" generics="T">
	// Generic, accessible data table. Columns are typed against the row type; a
	// column renders row[key] by default, a `get` accessor, or a custom
	// `cellSnippets[key]` snippet for full control (badges, actions…). Sticky
	// header, empty state, optional row click (the table becomes a grid whose
	// rows are focusable and Enter/Space-activatable; rows stay rows for AT). Horizontal scroll is contained so it never
	// breaks the page layout on mobile. `actions` renders one inline action and
	// a "more" menu per row; `selectable` adds a selection mode (checkbox column
	// and a floating selection bar, both only while `selecting`).
	import { type Snippet, untrack } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Checkbox from '$lib/components/atoms/Checkbox.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import Skeleton from '$lib/components/atoms/Skeleton.svelte';
	import IconButton from '$lib/components/molecules/IconButton.svelte';
	import Menu from '$lib/components/molecules/Menu.svelte';

	let {
		columns,
		rows,
		rowKey,
		onrowclick,
		onsort,
		cellSnippets = {},
		headerSnippets = {},
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
		actions,
		inlineActions = 1,
		moreLabel = 'More actions',
		selectable = false,
		selected = $bindable([]),
		selecting = $bindable(false),
		selectionActions,
		selectionLabel = (n) => `${n} selected`,
		selectLabel = 'Select',
		selectRowLabel,
		selectAllLabel = 'Select all',
		selectionBarLabel = 'Selection',
		doneLabel = 'Done',
		loading = false,
		loadingLabel = 'Loading…',
		loadingRows = 5,
		onloadmore,
		loadMoreLabel = 'Load more',
		responsive = 'scroll',
		stackBelow = '48rem',
		stackActions = 'start',
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
		/** Replaces a column's header content (e.g. a select-all checkbox). */
		headerSnippets?: Record<string, Snippet<[Column<T>]>>;
		empty?: string | Snippet;
		/** Sticks within the table's own scroller, which also scrolls horizontally,
		 *  so it only sticks when the table has a bounded height
		 *  (e.g. `style="max-height: 60vh"`), not to the page. */
		stickyHeader?: boolean;
		/** Distance from the scroller's top for the sticky header. Defaults to 0. */
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
		/** Data-driven row actions: the first `inlineActions` render as icon buttons,
		 *  the rest in a "more" menu. Rendered after `rowActions` when both are set. */
		actions?: (row: T) => RowAction[];
		/** Inline action count (default 1). Coarse pointers and stacked cards cap it at 1. */
		inlineActions?: number;
		/** Accessible name of the "more" menu trigger; the row's name is appended. */
		moreLabel?: string;
		/** Enables selection mode. With `actions`, each row menu gains a trailing
		 *  "Select" item that enters it with that row selected. */
		selectable?: boolean;
		/** Bindable row keys (`rowKey`) of the selected rows. Cleared on leaving selection mode. */
		selected?: (string | number)[];
		/** Bindable. While true the checkbox column and the selection bar show, a
		 *  row click toggles the row instead of `onrowclick`, and Escape leaves. */
		selecting?: boolean;
		/** Bulk actions in the selection bar; receives the selected rows. */
		selectionActions?: Snippet<[T[]]>;
		selectionLabel?: (count: number) => string;
		/** Label of the row menu item that enters selection mode. */
		selectLabel?: string;
		/** Accessible name of a row's checkbox. Defaults to `Select <title or first column value>`. */
		selectRowLabel?: (row: T) => string;
		selectAllLabel?: string;
		/** Accessible name of the selection bar. */
		selectionBarLabel?: string;
		doneLabel?: string;
		/** With no rows: `loadingRows` skeleton rows at the height of a data row.
		 *  With rows: the rows stay and one skeleton row trails them. */
		loading?: boolean;
		/** Announced to assistive tech while loading (visually hidden). */
		loadingLabel?: string;
		loadingRows?: number;
		/** Renders a footer "load more" button that calls this. */
		onloadmore?: () => void;
		loadMoreLabel?: string;
		/** `stack` renders each row as a card once the table's own box is narrower
		 *  than `stackBelow`; `scroll` (default) keeps a horizontal scroller. */
		responsive?: 'scroll' | 'stack';
		/** Width (px/em/rem) under which `stack` mode kicks in. */
		stackBelow?: string;
		/** Where actions sit in a stacked card: `start` beside the title (wraps
		 *  under a long one), `end` always closing the card. */
		stackActions?: 'start' | 'end';
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

	function markEmpty(node: HTMLElement) {
		const update = () => node.toggleAttribute('data-empty', !node.firstElementChild && !node.textContent?.trim());
		update();
		const observer = new MutationObserver(update);
		observer.observe(node, { childList: true, subtree: true, characterData: true });
		return () => observer.disconnect();
	}

	function toPx(length: string, el: HTMLElement): number {
		const n = Number.parseFloat(length);
		if (length.endsWith('rem')) return n * rootFontSize();
		if (length.endsWith('em')) return n * Number.parseFloat(getComputedStyle(el).fontSize);
		return n;
	}

	// Font sizes are read in the observer callback, after layout, so mounting never forces a style recalc.
	$effect(() => {
		if (responsive !== 'stack' || !wrapEl) {
			stacked = false;
			return;
		}
		const el = wrapEl;
		const below = stackBelow;
		const observer = new ResizeObserver(([entry]) => {
			const limit = toPx(below, el);
			stacked = entry.contentRect.width < limit;
		});
		observer.observe(el);
		return () => observer.disconnect();
	});

	let sortKey = $state<string | null>(null);
	let sortDir = $state<'asc' | 'desc'>('asc');

	let coarse = $state(false);

	$effect(() => {
		const query = window.matchMedia?.('(pointer: coarse)');
		if (!query) return;
		const update = () => (coarse = query.matches);
		update();
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	});

	const hasActions = $derived(!!rowActions || !!actions);
	const showSelect = $derived(selectable && selecting);
	const inlineCount = $derived.by(() => {
		const n = Math.max(0, Math.floor(inlineActions));
		return coarse || stacked ? Math.min(1, n) : n;
	});
	const colCount = $derived(columns.length + (hasActions ? 1 : 0) + (showSelect ? 1 : 0));
	const skeletonRows = $derived(rows.length ? 1 : Math.max(1, Math.floor(loadingRows)));

	const selectedKeys = $derived(new Set(selected));
	const selectedRows = $derived(rows.filter((row) => selectedKeys.has(rowKey(row))));

	function rowName(row: T): string | undefined {
		const col = columns.find((c) => c.role === 'title') ?? columns[0];
		const value = col && display(col, row);
		return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
	}

	function checkboxLabel(row: T): string {
		if (selectRowLabel) return selectRowLabel(row);
		const name = rowName(row);
		return name ? `${selectLabel} ${name}` : `${selectLabel} row`;
	}

	function splitActions(row: T): { inline: RowAction[]; menu: RowAction[] } {
		const all = actions?.(row) ?? [];
		const menu = all.slice(inlineCount);
		if (selectable && !selecting) {
			menu.push({ id: SELECT_ACTION_ID, label: selectLabel, icon: 'check-circle', onselect: () => startSelection(row) });
		}
		return { inline: all.slice(0, inlineCount), menu };
	}

	function startSelection(row: T) {
		selecting = true;
		selected = [rowKey(row)];
	}

	function endSelection() {
		selecting = false;
		selected = [];
	}

	function toggleRow(row: T) {
		const key = rowKey(row);
		selected = selectedKeys.has(key) ? selected.filter((k) => k !== key) : [...selected, key];
	}

	function toggleAll(on: boolean) {
		const visible = new Set(sortedRows.map(rowKey));
		const rest = selected.filter((k) => !visible.has(k));
		selected = on ? [...rest, ...visible] : rest;
	}

	$effect(() => {
		if (selectable && !selecting && untrack(() => selected.length)) selected = [];
	});

	function selectionBar(node: HTMLElement) {
		node.showPopover?.();
		const root = document.documentElement;
		const publish = () =>
			root.style.setProperty(
				'--selectionbar-h',
				`calc(${Math.ceil(node.getBoundingClientRect().height)}px + var(--sp-4))`
			);
		publish();
		const observer = new ResizeObserver(publish);
		observer.observe(node);
		return () => {
			observer.disconnect();
			root.style.removeProperty('--selectionbar-h');
		};
	}

	const NESTED_CONTROL = 'a,button,input,select,textarea,label,summary,[role="button"],[contenteditable]';

	function fromNestedControl(e: Event & { currentTarget: HTMLElement }): boolean {
		const hit = (e.target as Element).closest(NESTED_CONTROL);
		return !!hit && hit !== e.currentTarget && e.currentTarget.contains(hit);
	}

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

	const selectedVisible = $derived(sortedRows.filter((row) => selectedKeys.has(rowKey(row))).length);
</script>

<svelte:window
	onkeydown={showSelect
		? (e) => {
				if (e.key !== 'Escape' || e.defaultPrevented) return;
				if ((e.target as Element).closest?.(OWN_ESCAPE)) return;
				endSelection();
			}
		: undefined}
/>

<div
	bind:this={wrapEl}
	class="dt-scroll {klass}"
	style={styleProp}
	class:dt-stack={responsive === 'stack'}
	data-tsu="DataTable"
	data-size={size}
	data-stacked={stacked || undefined}
	data-stack-actions={responsive === 'stack' && stackActions === 'end' ? 'end' : undefined}
	aria-busy={loading || undefined}
>
	<span class="sr-only" role="status">{loading ? loadingLabel : ''}</span>
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
				{#if showSelect}
					<th scope="col" class="dt-select">
						<Checkbox
							label={selectAllLabel}
							labelHidden
							size="sm"
							checked={sortedRows.length > 0 && selectedVisible === sortedRows.length}
							indeterminate={selectedVisible > 0 && selectedVisible < sortedRows.length}
							disabled={sortedRows.length === 0}
							onchange={(e) => toggleAll(e.currentTarget.checked)}
						/>
					</th>
				{/if}
				{#each columns as col (col.key)}
					<th
						scope="col"
						data-hide-below={col.hideBelow}
						class:dt-sortable={col.sortable && !headerSnippets[col.key]}
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
						{#if headerSnippets[col.key]}
							{@render headerSnippets[col.key](col)}
						{:else if col.sortable}
							<button type="button" class="dt-sort" onclick={() => toggleSort(col)}>
								<span>{col.label}</span>
								<span
									class="dt-arrow"
									aria-hidden="true"
									class:active={sortKey === col.key}
									class:desc={sortKey === col.key && sortDir === 'desc'}
								>
									{sortKey === col.key ? '↑' : '↕'}
								</span>
							</button>
						{:else}
							{col.label}
						{/if}
					</th>
				{/each}
				{#if hasActions}
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
					{@const picked = showSelect && selectedKeys.has(rowKey(row))}
					{@const activate = showSelect ? () => toggleRow(row) : onrowclick ? () => onrowclick(row) : undefined}
					<tr
						data-part="row"
						data-tone={tone}
						data-selected={picked || undefined}
						aria-selected={showSelect && onrowclick ? picked : undefined}
						class={rowClass?.(row)}
						class:clickable={!!activate}
						class:toned={!!tone && tone !== 'neutral'}
						tabindex={onrowclick ? 0 : undefined}
						onclick={activate
							? (e) => {
									if (!fromNestedControl(e)) activate();
								}
							: undefined}
						onkeydown={activate
							? (e) => {
									if (e.target !== e.currentTarget) return;
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										activate();
									}
								}
							: undefined}
					>
						{#if showSelect}
							<td data-part="select" class="dt-select">
								<Checkbox
									label={checkboxLabel(row)}
									labelHidden
									size="sm"
									checked={picked}
									onchange={() => toggleRow(row)}
								/>
							</td>
						{/if}
						{#each columns as col (col.key)}
							{@const value = cellSnippets[col.key] ? undefined : display(col, row)}
							<td
								data-part="cell"
								data-hide-below={col.hideBelow}
								data-role={responsive === 'stack' ? (col.role ?? 'detail') : undefined}
								data-label={responsive === 'stack' ? col.label : undefined}
								data-stack-label={responsive === 'stack' && col.stackLabel === false ? 'false' : undefined}
								data-empty={responsive === 'stack' && !cellSnippets[col.key] && (value == null || value === '')
									? ''
									: undefined}
								class:truncate={col.truncate}
								class:nowrap={col.nowrap}
								style:text-align={stacked ? undefined : (col.align ?? 'left')}
								{@attach responsive === 'stack' && cellSnippets[col.key] ? markEmpty : undefined}
							>
								{#if cellSnippets[col.key]}
									{@render cellSnippets[col.key](row)}
								{:else}
									{value}
								{/if}
							</td>
						{/each}
						{#if hasActions}
							{@const built = actions ? splitActions(row) : undefined}
							<td data-part="actions" class="dt-actions">
								<span class="dt-actions-inner" use:measureActions>
									{#if rowActions}{@render rowActions(row)}{/if}
									{#if built}
										{#each built.inline as action (action.id)}
											{#if action.icon}
												<IconButton
													icon={action.icon}
													label={action.label}
													box="sm"
													size={16}
													tone={action.danger ? 'danger' : 'none'}
													disabled={action.disabled}
													data-action={action.id}
													onclick={action.onselect}
												/>
											{:else}
												<Button
													size="sm"
													variant="ghost"
													tone={action.danger ? 'danger' : 'none'}
													disabled={action.disabled}
													data-action={action.id}
													onclick={action.onselect}
												>
													{action.label}
												</Button>
											{/if}
										{/each}
										{#if built.menu.length}
											{@const name = rowName(row)}
											<Menu
												label={name ? `${moreLabel}: ${name}` : moreLabel}
												items={built.menu}
												placement="bottom-end"
												box="sm"
											>
												{#snippet trigger()}<Icon name="more" size={16} />{/snippet}
											</Menu>
										{/if}
									{/if}
								</span>
							</td>
						{/if}
					</tr>
				{/each}
			{/if}
			{#if loading}
				{#each { length: skeletonRows } as _, r (r)}
					{@render skeletonRow(r)}
				{/each}
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

{#if showSelect}
	<div
		class="dt-selbar"
		data-part="selection-bar"
		role="group"
		aria-label={selectionBarLabel}
		popover="manual"
		{@attach selectionBar}
	>
		<span class="dt-selbar-count" aria-live="polite">{selectionLabel(selected.length)}</span>
		{@render selectionActions?.(selectedRows)}
		<Button size="sm" variant="ghost" onclick={endSelection}>{doneLabel}</Button>
	</div>
{/if}

{#snippet skeletonRow(r: number)}
	<tr data-part="skeleton">
		{#if showSelect}
			<td data-part="select" class="dt-select"></td>
		{/if}
		{#each columns as col, c (col.key)}
			<td
				data-hide-below={col.hideBelow}
				data-role={responsive === 'stack' ? (col.role ?? 'detail') : undefined}
				class:dt-skeleton-end={!stacked && col.align === 'right'}
				class:dt-skeleton-center={!stacked && col.align === 'center'}
			>
				<Skeleton width={SKELETON_WIDTHS[(c * 2 + r) % SKELETON_WIDTHS.length]} />
			</td>
		{/each}
		{#if hasActions}
			<td data-part="actions" class="dt-actions">
				{#if actions}
					<span class="dt-actions-inner"><Skeleton width="var(--box-sm)" height="var(--box-sm)" /></span>
				{/if}
			</td>
		{/if}
	</tr>
{/snippet}

<style>
	.dt-scroll {
		width: 100%;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		border: var(--edge-width) solid var(--surface-edge);
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
		border-bottom: var(--edge-width) solid var(--surface-edge);
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
		background: var(--surface-fill-2);
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
	th.dt-sortable {
		position: relative;
	}
	/* The whole header cell is the sort hit area. */
	.dt-sort::after {
		content: '';
		position: absolute;
		inset: 0;
	}
	.dt-arrow {
		display: inline-block;
		opacity: 0.4;
		font-size: 0.9em;
		transition:
			rotate var(--dur-base) var(--ease-out),
			opacity var(--dur-fast) var(--ease);
	}
	.dt-arrow.active {
		opacity: 1;
		color: var(--accent);
	}
	.dt-arrow.desc {
		rotate: 180deg;
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	tr.clickable {
		cursor: pointer;
		transition: background var(--dur-fast) var(--ease);
	}
	tr.clickable:focus-visible {
		background: var(--bg-elevated-2);
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset-inset);
	}
	@media (hover: hover) and (pointer: fine) {
		.dt-sort:hover {
			color: var(--text);
		}
		tr.clickable:hover {
			background: var(--bg-elevated-2);
			transition-duration: var(--dur-instant);
		}
		tr:hover .dt-actions {
			opacity: 1;
		}
		.dt-more-btn:hover {
			background: var(--bg-elevated-2);
		}
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
	tr[data-selected] {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}
	.dt-select {
		width: 1%;
		white-space: nowrap;
	}
	/* Block-level, so the box never stretches the header's line box. */
	.dt-select > :global(.checkbox) {
		display: flex;
	}
	.dt-skeleton-end > :global(.skeleton) {
		margin-inline-start: auto;
	}
	.dt-skeleton-center > :global(.skeleton) {
		margin-inline: auto;
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
		transition: opacity var(--dur-fast) var(--ease);
	}
	.dt-actions-inner {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		white-space: nowrap;
	}
	tr:focus-within .dt-actions {
		opacity: 1;
	}
	@media (pointer: coarse) {
		.dt-actions {
			opacity: 1;
		}
		.dt-actions-inner {
			--box-sm: var(--touch-target);
		}
		/* The last row's checkbox slab would otherwise add a scroll range. */
		tbody tr:last-child td :global(.checkbox::before) {
			inset-block-end: 0;
		}
		/* The cell overlay grows vertically to the compact target, never sideways. */
		.dt-sort::after {
			inset-block: min(0px, calc((100% - var(--touch-target-compact)) / 2));
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
	[data-stacked] .dt {
		table-layout: fixed;
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
		border-bottom: var(--edge-width) solid var(--surface-edge);
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
		font-family: var(--dt-meta-font, var(--font-mono));
		font-size: var(--fs-xs);
		color: var(--text-muted);
	}
	[data-stacked] td[data-role='meta']::before {
		content: attr(data-label) ' ';
		font-family: var(--font-sans);
		color: var(--text-muted);
	}
	[data-stacked] td[data-role='detail'][data-stack-label='false'] {
		flex: 0 1 auto;
	}
	[data-stacked] td[data-stack-label='false']::before {
		content: none;
	}
	[data-stacked] td[data-part='cell'][data-empty] {
		display: none;
	}
	[data-stacked]
		td[data-role='meta']:not([data-empty])
		~ td[data-role='meta'][data-stack-label='false']:not([data-empty]) {
		margin-inline-start: calc(var(--sp-1) - var(--sp-3));
	}
	[data-stacked]
		td[data-role='meta']:not([data-empty])
		~ td[data-role='meta'][data-stack-label='false']:not([data-empty])::before {
		content: '·';
		margin-inline-end: var(--sp-1);
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
	[data-stacked][data-stack-actions='end'] td[data-role='actions'],
	[data-stacked][data-stack-actions='end'] td.dt-actions {
		order: 2;
	}
	[data-stacked] td[data-role='hidden'] {
		display: none;
	}
	[data-stacked] td.dt-select {
		flex: none;
		order: -3;
		width: auto;
	}
	[data-stacked] tr[data-part='skeleton'] td::before {
		content: none;
	}
	[data-stacked] td.dt-empty,
	[data-stacked] td.dt-more {
		text-align: center;
	}
	.dt-empty {
		text-align: center;
		color: var(--text-muted);
		padding: var(--sp-8);
	}
	.dt-more {
		text-align: center;
		padding: var(--sp-2);
		border-top: var(--edge-width) solid var(--surface-edge);
	}
	.dt-more-btn {
		border: 0;
		background: none;
		padding: var(--sp-1) var(--sp-3);
		font: inherit;
		color: var(--accent);
		cursor: pointer;
		border-radius: var(--r-md);
	}
	.dt-more-btn:focus-visible {
		background: var(--bg-elevated-2);
	}
	/* Top layer (popover) so no ancestor transform or containment can re-anchor it. */
	.dt-selbar {
		position: fixed;
		inset: auto;
		left: 50%;
		translate: -50% 0;
		bottom: calc(var(--safe-bottom, 0px) + var(--tabbar-h, 0px) + var(--sp-4));
		z-index: calc(var(--z-toast) - 1);
		display: flex;
		align-items: center;
		gap: var(--sp-3);
		width: max-content;
		max-width: calc(100% - var(--sp-8));
		margin: 0;
		padding: var(--sp-2) var(--sp-2) var(--sp-2) var(--sp-4);
		border: var(--edge-width) solid var(--raised-edge);
		border-radius: var(--r-lg);
		background: var(--raised-fill);
		box-shadow: var(--raised-shadow);
		color: var(--text);
		font-size: var(--fs-sm);
		overflow: visible;
		transition:
			opacity var(--dur-base) var(--ease-out),
			translate var(--dur-base) var(--ease-out);
	}
	@starting-style {
		.dt-selbar {
			opacity: 0;
			translate: -50% var(--shift-md);
		}
	}
	.dt-selbar-count {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
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
