<script lang="ts">
	import DataTable, { type RowAction } from '../../src/lib/components/organisms/DataTable.svelte';

	type Row = { id: number; name: string };

	let {
		rows = [],
		loadingRows,
		stack = false,
		withActions = false,
	}: { rows?: Row[]; loadingRows?: number; stack?: boolean; withActions?: boolean } = $props();

	const columns = [
		{ key: 'name', label: 'Name', role: 'title' as const },
		{ key: 'id', label: 'Id', hideBelow: 'sm' as const, align: 'right' as const },
		{ key: 'kind', label: 'Kind', role: 'meta' as const },
	];
	const actions = (): RowAction[] => [{ id: 'open', label: 'Open', icon: 'external', onselect: () => {} }];
</script>

<DataTable
	{columns}
	{rows}
	rowKey={(r) => r.id}
	loading
	loadingLabel="Loading rows"
	{loadingRows}
	responsive={stack ? 'stack' : 'scroll'}
	actions={withActions ? actions : undefined}
/>
