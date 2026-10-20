<script lang="ts">
	import Button from '../../src/lib/components/atoms/Button.svelte';
	import Checkbox from '../../src/lib/components/atoms/Checkbox.svelte';
	import Switch from '../../src/lib/components/atoms/Switch.svelte';
	import DataTable, { type Column } from '../../src/lib/components/organisms/DataTable.svelte';

	type Row = { id: number; name: string; role: string; status: string };

	const columns: Column<Row>[] = [
		{ key: 'pick', label: 'Pick', width: '3rem' },
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'role', label: 'Role', sortable: true },
		{ key: 'status', label: 'Status' }
	];
	const rows: Row[] = [
		{ id: 1, name: 'api-gateway', role: 'service', status: 'ok' },
		{ id: 2, name: 'worker-02', role: 'worker', status: 'warn' }
	];
</script>

<div data-probe="table">
	<DataTable {columns} {rows} rowKey={(r) => r.id} headerSnippets={{ pick }} />
</div>
<div data-probe="table-sm">
	<DataTable {columns} {rows} rowKey={(r) => r.id} size="sm" headerSnippets={{ pick }} />
</div>
<div data-probe="checkbox" style="padding: 24px 0">
	<Checkbox size="sm" label="Small" labelHidden />
</div>
<div data-probe="checkbox-row" style="padding: 24px 0; display: flex; gap: 8px">
	<Checkbox size="sm" label="One" labelHidden />
	<Checkbox size="sm" label="Two" labelHidden />
	<Checkbox size="sm" label="Three" labelHidden />
</div>
<p data-probe="link" style="padding: 24px 0">
	<Button variant="link">Link</Button>
	<Button variant="link" tone="danger">Link danger</Button>
</p>
<div data-probe="switch" style="padding: 24px 0">
	<Switch size="sm" label="Small switch" />
</div>

{#snippet pick(col: Column<Row>)}
	<Checkbox size="sm" label={col.label} labelHidden />
{/snippet}
