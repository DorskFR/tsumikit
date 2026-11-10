<script module>
	export const meta = {
		title: 'States',
		caption: 'loading with no rows renders loadingRows skeleton rows at the height of data rows; loading over existing rows trails one; empty as a string or a snippet, onloadmore footer, and a long unbroken name in a fixed layout.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { AutoGrid, DataTable, EmptyState, Switch, type Column } from '@dorsk/tsumikit';
	import { services, type Service } from './data';

	const columns: Column<Service>[] = [
		{ key: 'name', label: 'Service', truncate: true },
		{ key: 'region', label: 'Region', width: '9rem', nowrap: true },
	];
	const longRows: Service[] = [
		{ ...services[0], id: 99, name: 'eu-west-1-analytics-warehouse-rebuild-overnight-batch-worker-pool-07' },
		services[1],
	];
	let shown = $state(2);
	let loading = $state(true);
	const firstLoad = services.slice(0, 4);
</script>

{#snippet nothing()}
	<EmptyState size="inline" icon="search" title="No services match" description="Clear the region filter to see all six." />
{/snippet}

<Switch bind:checked={loading} label="First load in flight" />
<AutoGrid min="18rem" gap="var(--sp-4)">
	<DataTable
		{columns}
		rows={loading ? [] : firstLoad}
		rowKey={(s) => s.id}
		{loading}
		loadingRows={firstLoad.length}
		loadingLabel="Loading fleet…"
	/>
	<DataTable {columns} rows={firstLoad} rowKey={(s) => s.id} />
</AutoGrid>
<AutoGrid min="18rem" gap="var(--sp-4)">
	<DataTable
		{columns}
		rows={loading ? [] : firstLoad}
		rowKey={(s) => s.id}
		size="sm"
		{loading}
		loadingRows={firstLoad.length}
		loadingLabel="Loading fleet…"
	/>
	<DataTable {columns} rows={firstLoad} rowKey={(s) => s.id} size="sm" />
</AutoGrid>
<DataTable {columns} rows={services.slice(0, 2)} rowKey={(s) => s.id} loading loadingLabel="Refreshing fleet…" />
<DataTable {columns} rows={[]} rowKey={(s) => s.id} empty="No services deployed yet." />
<DataTable {columns} rows={[]} rowKey={(s) => s.id} empty={nothing} />
<DataTable
	{columns}
	rows={services.slice(0, shown)}
	rowKey={(s) => s.id}
	size="sm"
	onloadmore={shown < services.length ? () => (shown += 2) : undefined}
	loadMoreLabel="Show 2 more"
/>
<DataTable {columns} rows={longRows} rowKey={(s) => s.id} layout="fixed" size="sm" />
