<script module>
	export const meta = {
		title: 'Incident summary card',
		caption: 'Nested Stacks: a tight gap="var(--sp-1)" for the title block, the default --sp-3 between blocks.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Button, Card, Cluster, Heading, Stack, Text } from '@dorsk/tsumikit';
</script>

<Card maxWidth="34rem">
	<Stack>
		<Stack gap="var(--sp-1)">
			<Cluster>
				<Badge tone="danger" size="xs">SEV-2</Badge>
				<Text size="xs" tone="muted" numeric>Opened 09:42 UTC · 18 min ago</Text>
			</Cluster>
			<Heading level={3} size="md">cache-01 evicting keys under memory pressure</Heading>
		</Stack>
		<Text tone="muted">
			Hit rate fell from 94% to 61% after the 09:30 deploy. Checkout latency p95 is up 340 ms in
			us-east-1.
		</Text>
		<Cluster justify="flex-end">
			<Button variant="ghost">Snooze</Button>
			<Button variant="primary">Acknowledge</Button>
		</Cluster>
	</Stack>
</Card>
