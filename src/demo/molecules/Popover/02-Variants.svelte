<script module>
	export const meta = {
		title: 'Trigger chrome and placements',
		caption: 'default ghost icon trigger; variant/tone/size/box/pill/control as on Button; placement is one of four corners.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Icon, Popover, Text } from '@dorsk/tsumikit';

	const placements = ['bottom-start', 'bottom-end', 'top-start', 'top-end'] as const;
</script>

{#snippet note(text: string)}
	<div class="note"><Text size="sm">{text}</Text></div>
{/snippet}

<Cluster align="center">
	<Popover label="About this build">
		{#snippet trigger()}<Icon name="info" size={18} />{/snippet}
		{@render note('Default: a ghost icon trigger that floors at the sm box.')}
	</Popover>
	<Popover label="Tags" box="xs">
		{#snippet trigger()}<Icon name="tag" size={12} />{/snippet}
		{@render note('box="xs" pins the square for dense rows.')}
	</Popover>
	<Popover label="Share" variant="default" size="sm">
		{#snippet trigger()}Share <Icon name="chevron-down" size={14} />{/snippet}
		{@render note('A default button trigger, small size.')}
	</Popover>
	<Popover label="Deploy" variant="primary">
		{#snippet trigger()}Deploy{/snippet}
		{@render note('Primary chrome for the main action.')}
	</Popover>
	<Popover label="Filters" variant="toggle" pressed pill>
		{#snippet trigger()}<Icon name="filter" size={14} /> 2 filters{/snippet}
		{@render note('variant="toggle" renders the Toggle chip; pressed paints it on.')}
	</Popover>
	<Popover label="Incidents" variant="default" tone="danger" count={3}>
		{#snippet trigger()}<Icon name="warning" size={16} /> Incidents{/snippet}
		{@render note('tone and count as on Button.')}
	</Popover>
</Cluster>
<Cluster align="center">
	{#each placements as placement (placement)}
		<Popover label="Placement {placement}" {placement} variant="default" size="sm">
			{#snippet trigger()}{placement}{/snippet}
			{@render note(`Opens ${placement}, flipping into the viewport when it would overflow.`)}
		</Popover>
	{/each}
</Cluster>

<style>
	.note {
		max-width: 16rem;
		padding: var(--sp-2) var(--sp-3);
	}
</style>
