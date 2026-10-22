<script module>
	export const meta = {
		title: 'Fleet status row',
		caption: 'tone for health, dot for a live indicator, mono for a region, numeric for a counter and removable tags on a filter bar.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Cluster, Text } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';

	const TONE = { ok: 'ok', warn: 'warn', danger: 'danger' } as const;
	const LABEL = { ok: 'healthy', warn: 'degraded', danger: 'down' } as const;
	let filters = $state(['region:eu-west-1', 'role:worker']);
</script>

<Cluster>
	<Text size="sm" tone="muted">Filters</Text>
	{#each filters as f (f)}
		<Badge mono size="sm" removable onremove={() => (filters = filters.filter((x) => x !== f))}>{f}</Badge>
	{/each}
	{#if filters.length === 0}<Text size="sm" tone="faint">none</Text>{/if}
</Cluster>
{#each services.slice(0, 4) as svc (svc.id)}
	<Cluster justify="space-between">
		<Cluster gap="var(--sp-2)">
			<Text weight="medium">{svc.name}</Text>
			<Badge variant="text" mono tone="muted">{svc.region}</Badge>
		</Cluster>
		<Cluster gap="var(--sp-2)">
			<Badge size="xs" numeric tone={svc.cpu > 80 ? 'warn' : 'neutral'}>{svc.cpu}%</Badge>
			<Badge tone={TONE[svc.status]} dot size="sm" uppercase>{LABEL[svc.status]}</Badge>
		</Cluster>
	</Cluster>
{/each}
