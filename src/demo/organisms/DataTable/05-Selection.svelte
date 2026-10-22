<script module>
	export const meta = {
		title: 'Bulk selection',
		caption: 'headerSnippets puts a select-all Checkbox (indeterminate when partial) over a checkbox column from cellSnippets; rowClass marks picked rows.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Checkbox, Cluster, DataTable, Text, type Column } from '@dorsk/tsumikit';
	import { services, type Service } from './data';

	const columns: Column<Service>[] = [
		{ key: 'pick', label: 'Select', width: '2.5rem' },
		{ key: 'name', label: 'Service' },
		{ key: 'region', label: 'Region', hideBelow: 'sm' },
	];
	let picked = $state<number[]>([2, 6]);
	const all = $derived(picked.length === services.length);
</script>

{#snippet pickAll()}
	<Checkbox
		label="Select all services"
		labelHidden
		size="sm"
		checked={all}
		indeterminate={picked.length > 0 && !all}
		onchange={(e) => (picked = e.currentTarget.checked ? services.map((s) => s.id) : [])}
	/>
{/snippet}
{#snippet pickOne(s: Service)}
	<Checkbox
		label="Select {s.name}"
		labelHidden
		size="sm"
		checked={picked.includes(s.id)}
		onchange={(e) => (picked = e.currentTarget.checked ? [...picked, s.id] : picked.filter((id) => id !== s.id))}
	/>
{/snippet}

<Cluster align="center">
	<Text size="sm" tone="muted">{picked.length} of {services.length} selected</Text>
	<Button size="sm" disabled={!picked.length}>Restart</Button>
	<Button size="sm" variant="danger" disabled={!picked.length}>Drain</Button>
</Cluster>
<div class="fleet">
	<DataTable
		{columns}
		rows={services}
		rowKey={(s) => s.id}
		size="sm"
		headerSnippets={{ pick: pickAll }}
		cellSnippets={{ pick: pickOne }}
		rowClass={(s) => (picked.includes(s.id) ? 'picked' : undefined)}
	/>
</div>

<style>
	.fleet :global(.picked) {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}
</style>
