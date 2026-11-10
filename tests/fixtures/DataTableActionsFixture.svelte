<script lang="ts">
	import DataTable, { type RowAction } from '../../src/lib/components/organisms/DataTable.svelte';

	type Row = { id: number; name: string };

	let {
		log,
		count = 4,
		inlineActions,
		selectable = false,
		clickable = false,
		snippet = false,
		bulk = false,
		start = false,
	}: {
		log: string[];
		count?: number;
		inlineActions?: number;
		selectable?: boolean;
		clickable?: boolean;
		snippet?: boolean;
		bulk?: boolean;
		start?: boolean;
	} = $props();

	const columns = [
		{ key: 'name', label: 'Name' },
		{ key: 'id', label: 'Id' },
	];
	const rows: Row[] = [
		{ id: 1, name: 'alpha' },
		{ id: 2, name: 'beta' },
		{ id: 3, name: 'gamma' },
	];
	const all = (row: Row): RowAction[] => [
		{ id: 'open', label: 'Open', icon: 'external', onselect: () => log.push(`open:${row.id}`) },
		{ id: 'rename', label: 'Rename', onselect: () => log.push(`rename:${row.id}`) },
		{ id: 'copy', label: 'Copy', icon: 'copy', onselect: () => log.push(`copy:${row.id}`), disabled: true },
		{ id: 'delete', label: 'Delete', icon: 'trash', danger: true, onselect: () => log.push(`delete:${row.id}`) },
	];

	let selected = $state<(string | number)[]>([]);
	// svelte-ignore state_referenced_locally
	let selecting = $state(start);
</script>

<output data-testid="state">{JSON.stringify({ selected, selecting })}</output>
<button type="button" data-testid="enter" onclick={() => (selecting = true)}>enter</button>

<DataTable
	{columns}
	{rows}
	rowKey={(r) => r.id}
	actions={count > 0 ? (row) => all(row).slice(0, count) : undefined}
	{inlineActions}
	{selectable}
	bind:selected
	bind:selecting
	onrowclick={clickable ? (row) => log.push(`row:${row.id}`) : undefined}
	rowActions={snippet ? custom : undefined}
	selectionActions={bulk ? bulkActions : undefined}
/>

{#snippet custom(row: Row)}
	<button type="button" data-testid="custom-{row.id}" onclick={() => log.push(`custom:${row.id}`)}>Custom</button>
{/snippet}
{#snippet bulkActions(picked: Row[])}
	<span data-testid="bulk">{picked.map((r) => r.name).join(',')}</span>
{/snippet}
