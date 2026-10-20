<script lang="ts">
	import DataTable from '../../src/lib/components/organisms/DataTable.svelte';

	let { log }: { log: string[] } = $props();

	const columns = [
		{ key: 'pick', label: 'Pick' },
		{ key: 'name', label: 'Name', sortable: true }
	];
	const rows = [{ id: 1, name: 'a' }];
</script>

<DataTable {columns} {rows} rowKey={(r) => r.id} onrowclick={() => log.push('row')} cellSnippets={{ pick }}>
	{#snippet rowActions()}
		<button type="button" data-testid="act" onclick={() => log.push('action')}>Del<span>!</span></button>
	{/snippet}
</DataTable>

{#snippet pick()}
	<label data-testid="pick-label"><input type="checkbox" data-testid="pick" onchange={() => log.push('pick')} /> pick</label>
{/snippet}
