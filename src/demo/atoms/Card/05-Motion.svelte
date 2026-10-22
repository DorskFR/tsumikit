<script module>
	export const meta = {
		title: 'Micro-interactions',
		caption: 'data-fx-card on any ancestor lights tappable cards: "spotlight" (default) follows the pointer, "orbit" runs one comet round the edge on hover, "none" keeps the plain lift.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Card, Text } from '@dorsk/tsumikit';

	const variants = ['spotlight', 'orbit', 'none'] as const;
	let opened = $state('');
</script>

{#each variants as v (v)}
	<div data-fx-card={v}>
		<Card interactive onclick={() => (opened = v)} gap="var(--sp-1)">
			<Text weight="semibold">Deployments</Text>
			<Text size="sm" tone="muted">data-fx-card="{v}" · 12 releases this week{opened === v ? ' · opened' : ''}</Text>
		</Card>
	</div>
{/each}
