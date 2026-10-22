<script module>
	export const meta = {
		title: 'Counts, option snippet and justify',
		caption: 'disabled options are skipped by the keyboard; string counts render verbatim; the option snippet replaces a row; justify pins the control in a flex row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Dot, SegmentedControl, Text, type SegmentOption } from '@dorsk/tsumikit';

	const envs: SegmentOption[] = [
		{ value: 'dev', label: 'Dev' },
		{ value: 'staging', label: 'Staging', count: '99+' },
		{ value: 'prod', label: 'Production', count: 'frozen', disabled: true }
	];
	const health: (SegmentOption & { tone: 'ok' | 'warn' | 'danger' })[] = [
		{ value: 'ok', label: 'Healthy', tone: 'ok', count: 4 },
		{ value: 'warn', label: 'Degraded', tone: 'warn', count: 2 },
		{ value: 'danger', label: 'Down', tone: 'danger', count: 1 }
	];
	let env = $state<string | undefined>('dev');
	let healthState = $state<string | undefined>('ok');
</script>

<SegmentedControl options={envs} bind:value={env} label="Environment" />
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
	<SegmentedControl justify="end" size="sm" options={envs} value="dev" label="Environment pinned end" />
</Cluster>

<style>
	.health {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
	}
</style>
