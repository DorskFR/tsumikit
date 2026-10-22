<script module>
	export const meta = {
		title: 'Toolbar alignment and custom segments',
		caption: 'control height-matches Button, Input and Switch siblings; box lines an icon toggle up with square buttons; the option snippet renders each segment.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Dot, Input, SegmentedControl, Text } from '@dorsk/tsumikit';
	import { viewModes } from './data';

	let view = $state('list');
	let env = $state('prod');
	const envs = [
		{ value: 'dev', label: 'dev', status: 'stale' },
		{ value: 'staging', label: 'staging', status: 'hibernated' },
		{ value: 'prod', label: 'prod', status: 'active' }
	] as const;
</script>

<Cluster align="center">
	<Input size="sm" placeholder="Filter services" aria-label="Filter services" width="12rem" />
	<SegmentedControl control size="sm" options={[{ value: 'running', label: 'Running', count: 12 }, { value: 'stopped', label: 'Stopped', count: 2 }]} value="running" label="Status" />
	<Button size="sm" control>Refresh</Button>
	<SegmentedControl box variant="icon" options={viewModes} bind:value={view} label="View" />
	<Button square variant="default" aria-label="Square sibling">A</Button>
</Cluster>
<SegmentedControl options={envs.map(({ value, label }) => ({ value, label }))} bind:value={env} label="Environment">
	{#snippet option(o, selected)}
		<span class="env">
			<Dot status={envs.find((e) => e.value === o.value)?.status ?? 'active'} />
			<Text size="sm" mono weight={selected ? 'semibold' : 'normal'}>{o.label}</Text>
		</span>
	{/snippet}
</SegmentedControl>

<style>
	.env {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
	}
</style>
