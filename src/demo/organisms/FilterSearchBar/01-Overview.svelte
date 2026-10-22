<script module>
	export const meta = {
		title: 'Fleet search',
		caption: 'bind:value holds the raw query; parse gives the AST that compilePredicate runs in memory and toSql hands to a backend. Click a preset or type role:… by hand.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Cluster, CodeBlock, compilePredicate, DataTable, FilterSearchBar, parse, toSql, type Column } from '@dorsk/tsumikit';
	import { fleetSchema, presets, services, type Service } from './data';

	const columns: Column<Service>[] = [
		{ key: 'name', label: 'Service' },
		{ key: 'role', label: 'Role', hideBelow: 'sm' },
		{ key: 'region', label: 'Region', hideBelow: 'md' },
		{ key: 'cpu', label: 'CPU %', align: 'right' },
		{ key: 'status', label: 'Status' },
	];

	let value = $state('status!=ok');
	const query = $derived(parse(value, fleetSchema));
	const rows = $derived(services.filter(compilePredicate(query)));
</script>

<FilterSearchBar schema={fleetSchema} bind:value placeholder="role:worker status=ok" />
<Cluster>
	{#each presets as preset (preset)}
		<Badge as="button" tone={preset === value ? 'accent' : 'neutral'} onclick={() => (value = preset)}>{preset}</Badge>
	{/each}
</Cluster>
<DataTable {columns} {rows} rowKey={(s) => s.id} size="sm" empty="No services match the query." />
<CodeBlock code={toSql(query, 'services')} lang="sql" wrap />
