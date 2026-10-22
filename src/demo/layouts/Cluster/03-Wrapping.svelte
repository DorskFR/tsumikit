<script module>
	export const meta = {
		title: 'Wrapping and stacking',
		caption: 'Drag the preview edge: the default wraps, wrapAt="28rem" stays on one line until the row is narrower, stackAt="md" turns actions full-width under 40rem.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { Badge, Button, Cluster, Stack, Text } from '@dorsk/tsumikit';

	const labels = ['frontend', 'design-system', 'accessibility', 'good first issue', 'p2', 'release-blocker', 'docs'];
</script>

<Stack gap="var(--sp-1)">
	<Text size="xs" mono tone="muted">wrap (default)</Text>
	<Cluster gap="var(--sp-1)">
		{#each labels as label (label)}<Badge>{label}</Badge>{/each}
	</Cluster>
</Stack>
<Stack gap="var(--sp-1)">
	<Text size="xs" mono tone="muted">wrap={'{false}'}, scrolls instead</Text>
	<div style="overflow-x: auto">
		<Cluster wrap={false} gap="var(--sp-1)">
			{#each labels as label (label)}<Badge>{label}</Badge>{/each}
		</Cluster>
	</div>
</Stack>
<Stack gap="var(--sp-1)">
	<Text size="xs" mono tone="muted">wrapAt="28rem"</Text>
	<Cluster wrapAt="28rem">
		<Button size="sm">Duplicate</Button>
		<Button size="sm">Move to folder</Button>
		<Button size="sm">Export CSV</Button>
	</Cluster>
</Stack>
<Stack gap="var(--sp-1)">
	<Text size="xs" mono tone="muted">stackAt="md"</Text>
	<Cluster stackAt="md" justify="flex-end">
		<Button variant="ghost">Discard draft</Button>
		<Button variant="primary">Publish post</Button>
	</Cluster>
</Stack>
