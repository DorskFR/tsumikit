<script module>
	export const meta = {
		title: 'Toolbar, custom segments and justify',
		caption: 'control height-matches Button and Input siblings; box lines an icon toggle up with square buttons; the option snippet renders each segment; justify pins the control in a flex row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Dot, Input, SegmentedControl, Text, type SegmentOption } from '@dorsk/tsumikit';
	import { viewModes } from './data';

	const health: (SegmentOption & { tone: 'ok' | 'warn' | 'danger' })[] = [
		{ value: 'ok', label: 'Healthy', tone: 'ok', count: 4 },
		{ value: 'warn', label: 'Degraded', tone: 'warn', count: 2 },
		{ value: 'danger', label: 'Down', tone: 'danger', count: 1 }
	];
	let view = $state('list');
	let healthState = $state<string | undefined>('ok');
</script>

<Cluster align="center">
	<Input size="sm" placeholder="Filter services" aria-label="Filter services" width="12rem" />
	<SegmentedControl control size="sm" options={[{ value: 'running', label: 'Running', count: 12 }, { value: 'stopped', label: 'Stopped', count: 2 }]} value="running" label="Status" />
	<Button size="sm" control>Refresh</Button>
	<SegmentedControl box variant="icon" options={viewModes} bind:value={view} label="View" />
	<Button square variant="default" aria-label="Square sibling">A</Button>
</Cluster>
<SegmentedControl options={health} bind:value={healthState} label="Health">
	{#snippet option(o, selected)}
		<span class="health">
			<Dot color="var(--{(o as (typeof health)[number]).tone})" />
			<Text as="span" size="sm" weight={selected ? 'semibold' : 'normal'}>{o.label}</Text>
			<Text as="span" size="xs" tone="muted">{o.count}</Text>
		</span>
	{/snippet}
</SegmentedControl>
<Cluster>
	<Text size="sm" tone="muted">Services</Text>
	<SegmentedControl justify="end" size="sm" options={viewModes} bind:value={view} label="View pinned end" />
</Cluster>

<style>
	.health {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
	}
</style>
