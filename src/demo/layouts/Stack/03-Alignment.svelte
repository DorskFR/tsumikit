<script module>
	export const meta = {
		title: 'Alignment and push',
		caption: 'align sets the cross axis; fill with justify="space-between" spreads a fixed-height column; push="end" pins the last block to the bottom.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Badge, Button, Card, Stack, Text } from '@dorsk/tsumikit';

	const aligns = ['stretch', 'flex-start', 'center', 'flex-end'];
</script>

{#each aligns as align (align)}
	<Card padding="sm">
		<Stack {align} gap="var(--sp-2)">
			<Text size="xs" mono tone="muted">align="{align}"</Text>
			<Badge tone="info">eu-west-1</Badge>
			<Button size="sm">Failover</Button>
		</Stack>
	</Card>
{/each}
<Card padding="sm" style="height: 11rem">
	<Stack fill justify="space-between">
		<Text size="xs" mono tone="muted">justify="space-between"</Text>
		<Text>Plan: Team</Text>
		<Text size="sm" tone="muted">12 / 15 seats</Text>
	</Stack>
</Card>
<Card padding="sm" style="height: 11rem; display: flex; flex-direction: column">
	<Stack gap="var(--sp-1)">
		<Text size="xs" mono tone="muted">push="end"</Text>
		<Text>Storage is 92% full</Text>
	</Stack>
	<Stack push="end">
		<Button size="sm" variant="primary" block>Upgrade</Button>
	</Stack>
</Card>
