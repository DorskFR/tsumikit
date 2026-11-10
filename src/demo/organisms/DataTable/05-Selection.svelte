<script module>
	export const meta = {
		title: 'Selection mode',
		caption: 'selectable with bind:selected and bind:selecting: checkboxes and the floating selection bar exist only while selecting; a row click toggles the row, Escape or Done leaves. The row menu gains a trailing Select item.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, DataTable, Text, type Column, type RowAction } from '@dorsk/tsumikit';
	import { services, type Service } from './data';

	const columns: Column<Service>[] = [
		{ key: 'name', label: 'Service' },
		{ key: 'region', label: 'Region', hideBelow: 'sm' },
	];
	let selected = $state<(string | number)[]>([]);
	let selecting = $state(false);
	let last = $state('');

	const actions = (s: Service): RowAction[] => [
		{ id: 'logs', label: `Open logs for ${s.name}`, icon: 'external', onselect: () => (last = `Opened logs for ${s.name}`) },
		{ id: 'restart', label: 'Restart', icon: 'retry', onselect: () => (last = `Restarted ${s.name}`) },
	];

	function bulk(verb: string, picked: Service[]) {
		last = `${verb} ${picked.map((s) => s.name).join(', ')}`;
		selecting = false;
	}
</script>

<Cluster align="center" justify="space-between">
	<Text size="sm" tone="muted">{last || `${services.length} services`}</Text>
	<Button size="sm" pressed={selecting} onclick={() => (selecting = !selecting)}>Select</Button>
</Cluster>
<DataTable
	{columns}
	rows={services}
	rowKey={(s) => s.id}
	size="sm"
	{actions}
	selectable
	bind:selected
	bind:selecting
	onrowclick={(s) => (last = `Opened ${s.name}`)}
>
	{#snippet selectionActions(picked: Service[])}
		<Button size="sm" disabled={!picked.length} onclick={() => bulk('Restarted', picked)}>Restart</Button>
		<Button size="sm" variant="danger" disabled={!picked.length} onclick={() => bulk('Drained', picked)}>Drain</Button>
	{/snippet}
</DataTable>
