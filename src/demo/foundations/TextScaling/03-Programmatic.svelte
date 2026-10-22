<script module>
	export const meta = {
		title: 'The fontScale store',
		caption: 'fontScale.set(id) with one of SCALE_LEVELS; fontScale.current is the multiplier, persisted alongside the theme.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, fontScale, SCALE_LEVELS, Text } from '@dorsk/tsumikit';
</script>

<Cluster>
	{#each SCALE_LEVELS as level (level.id)}
		<Button size="sm" pressed={fontScale.levelId === level.id} onclick={() => fontScale.set(level.id)}>{level.label}</Button>
	{/each}
</Cluster>
<Text size="sm" tone="muted">--fs-scale is <Text mono>{fontScale.current}</Text></Text>
