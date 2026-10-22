<script module>
	export const meta = {
		title: 'Service tile with header, body and footer',
		caption: 'title, subtitle and actions render a SectionHeader; the footer snippet sits behind a divider; gap stacks the body.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Badge, Button, Card, Cluster, IconButton, Text } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';
</script>

{#each services.slice(0, 3) as svc (svc.id)}
	<Card title={svc.name} subtitle="{svc.role} · {svc.region}" gap="var(--sp-2)">
		{#snippet actions()}<IconButton icon="more" label="More" box="sm" />{/snippet}
		<Cluster gap="var(--sp-4)">
			<Text size="sm">CPU <Text numeric weight="medium">{svc.cpu}%</Text></Text>
			<Text size="sm">Mem <Text numeric weight="medium">{(svc.memoryMb / 1024).toFixed(1)} GB</Text></Text>
		</Cluster>
		<Text size="sm" tone="muted">Up for {svc.uptimeDays} days</Text>
		{#snippet footer()}
			<Cluster justify="space-between">
				<Badge tone={svc.status} dot size="sm" uppercase>{svc.status}</Badge>
				<Button size="sm" variant="ghost">Logs</Button>
			</Cluster>
		{/snippet}
	</Card>
{/each}
