<script module>
	export const meta = {
		title: 'Service health dashboard',
		caption: 'min="13rem": four columns on a desktop, one on a phone, no breakpoints. Drag the preview edge.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { AutoGrid, Badge, Card, Cluster, Progress, Stack, Text } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';

	const label = { ok: 'Healthy', warn: 'Degraded', danger: 'Down' } as const;
</script>

<AutoGrid min="13rem" gap="var(--sp-3)">
	{#each services as service (service.id)}
		<Card padding="sm">
			<Stack gap="var(--sp-2)">
				<Cluster justify="space-between">
					<Text weight="semibold" mono truncate>{service.name}</Text>
					<Badge tone={service.status} size="xs">{label[service.status]}</Badge>
				</Cluster>
				<Text size="xs" tone="muted">{service.role} · {service.region}</Text>
				<Progress value={service.cpu} label="CPU" block />
				<Text size="xs" tone="muted" numeric>CPU {service.cpu}% · {service.memoryMb} MB</Text>
			</Stack>
		</Card>
	{/each}
</AutoGrid>
