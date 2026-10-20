<script lang="ts">
	import DataTable, { type Column } from '../../src/lib/components/organisms/DataTable.svelte';

	type Row = { id: number; name: string; kind: string | null; size: string; age: string };

	let {
		rows,
		stackActions,
		stackBelow,
		withActions = false
	}: { rows: Row[]; stackActions?: 'start' | 'end'; stackBelow?: string; withActions?: boolean } = $props();

	const columns: Column<Row>[] = [
		{ key: 'name', label: 'Name', role: 'title' },
		{ key: 'kind', label: 'Kind', role: 'meta', stackLabel: false },
		{ key: 'size', label: 'Size', role: 'meta', stackLabel: false },
		{ key: 'age', label: 'Age', role: 'meta', stackLabel: false }
	];
</script>

<DataTable
	{columns}
	{rows}
	rowKey={(r) => r.id}
	responsive="stack"
	{stackActions}
	{stackBelow}
	cellSnippets={{ size }}
	rowActions={withActions ? actions : undefined}
/>

{#snippet size(row: Row)}
	{#if row.size}<span>{row.size}</span>{/if}
{/snippet}

{#snippet actions(row: Row)}
	<button type="button">Open {row.name}</button>
{/snippet}
