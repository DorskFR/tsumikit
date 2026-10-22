<script module>
	export const meta = {
		title: 'Placements, delay and width',
		caption: 'placement top/bottom/left/right; delay shortens or lengthens the hover wait; width and maxWidth size the bubble.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Tooltip } from '@dorsk/tsumikit';

	const placements = ['top', 'bottom', 'left', 'right'] as const;
</script>

<Cluster align="center">
	{#each placements as placement (placement)}
		<Tooltip text="Opens {placement} and flips when there is no room." {placement}>
			{#snippet trigger()}<Button size="sm">{placement}</Button>{/snippet}
		</Tooltip>
	{/each}
</Cluster>
<Cluster align="center">
	<Tooltip text="No wait." delay={0}>
		{#snippet trigger()}<Button size="sm">Instant</Button>{/snippet}
	</Tooltip>
	<Tooltip text="Appears after a full second, for hints that should not flash on a pass-by." delay={1000}>
		{#snippet trigger()}<Button size="sm">Slow</Button>{/snippet}
	</Tooltip>
	<Tooltip text="A wide bubble for a longer explanation: the retention policy keeps raw logs for 14 days and aggregates for 13 months." maxWidth="24rem">
		{#snippet trigger()}<Button size="sm">Wide</Button>{/snippet}
	</Tooltip>
	<Tooltip text="Fixed 8rem width wraps early." width="8rem">
		{#snippet trigger()}<Button size="sm">Narrow</Button>{/snippet}
	</Tooltip>
</Cluster>
