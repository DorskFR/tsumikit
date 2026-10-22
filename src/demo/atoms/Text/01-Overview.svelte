<script module>
	export const meta = {
		title: 'Service detail panel',
		caption: 'variant="eyebrow" kicks off a block, body carries the reading text, caption the meta, numeric keeps the figures steady, code marks an identifier.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Card, Cluster, Stack, Text } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';

	const svc = services[1];
</script>

<Card maxWidth="28rem">
	<Stack gap="var(--sp-2)">
		<Text variant="eyebrow">{svc.role} · {svc.region}</Text>
		<Text as="p" variant="body">
			<Text weight="semibold">{svc.name}</Text> has been restarting every few hours since the last deploy. Memory climbs steadily until the pod is evicted.
		</Text>
		<Cluster gap="var(--sp-4)">
			<Text variant="caption">CPU <Text numeric tone="warn">{svc.cpu}%</Text></Text>
			<Text variant="caption">Memory <Text numeric>{svc.memoryMb.toLocaleString()} MB</Text></Text>
			<Text variant="caption">Uptime <Text numeric>{svc.uptimeDays}d</Text></Text>
		</Cluster>
		<Text variant="caption" tone="muted">Last restart reason: <Text variant="code">OOMKilled</Text></Text>
	</Stack>
</Card>
