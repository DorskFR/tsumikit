<script lang="ts">
	import DataTable, { type Column } from '../../src/lib/components/organisms/DataTable.svelte';

	type Row = { id: number; name: string; role: string; status: string };

	let { columns, onpickall }: { columns: Column<Row>[]; onpickall?: (checked: boolean) => void } = $props();

	const rows: Row[] = [
		{ id: 1, name: 'api-gateway', role: 'service', status: 'ok' },
		{ id: 2, name: 'worker-02', role: 'worker', status: 'warn' }
	];
</script>

<DataTable {columns} {rows} rowKey={(r) => r.id} responsive="stack" headerSnippets={{ pick }} />

{#snippet pick(col: Column<Row>)}
	<input
		type="checkbox"
		data-testid="pick-all"
		aria-label={col.label}
		onchange={(e) => onpickall?.(e.currentTarget.checked)}
	/>
{/snippet}
