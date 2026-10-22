<script module>
	export const meta = {
		title: 'Session presence list',
		caption: 'status presets active, stale, hibernated and dead, glow on the live one, as a legend and inline beside each row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Dot, Stack, Text } from '@dorsk/tsumikit';

	const sessions = [
		{ name: 'tsumikit demo lane', status: 'active', age: 'now' },
		{ name: 'infra terraform plan', status: 'active', age: '2 min' },
		{ name: 'release notes draft', status: 'stale', age: '41 min' },
		{ name: 'weekend experiments', status: 'hibernated', age: '3 d' },
		{ name: 'migration dry run', status: 'dead', age: '9 d' }
	] as const;
</script>

<Cluster gap="var(--sp-4)">
	<Dot status="active" glow label="working" />
	<Dot status="stale" label="idle" />
	<Dot status="hibernated" label="hibernated" />
	<Dot status="dead" label="exited" />
</Cluster>
<Stack gap="var(--sp-1)">
	{#each sessions as s (s.name)}
		<Cluster justify="space-between">
			<Cluster gap="var(--sp-2)">
				<Dot status={s.status} glow={s.status === 'active'} />
				<Text size="sm">{s.name}</Text>
			</Cluster>
			<Text size="xs" tone="muted" numeric>{s.age}</Text>
		</Cluster>
	{/each}
</Stack>
