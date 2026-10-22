<script module>
	export const meta = {
		title: 'Density and grouping',
		caption: 'density="compact" halves the gap; vertical Dividers split groups without breaking the single tab stop.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Divider, IconButton, Stack, Text, Toolbar } from '@dorsk/tsumikit';

	const densities = ['default', 'compact'] as const;
</script>

{#each densities as density (density)}
	<Stack gap="var(--sp-1)">
		<Text size="xs" mono tone="muted">density="{density}"</Text>
		<Toolbar label="Player controls, {density}" {density}>
			<IconButton icon="play" label="Play" variant="primary" box="sm" />
			<IconButton icon="pause" label="Pause" box="sm" />
			<IconButton icon="stop" label="Stop" box="sm" />
			<Divider orientation="vertical" decorative />
			<IconButton icon="retry" label="Repeat" box="sm" />
			<IconButton icon="heart" label="Like" box="sm" />
			<Divider orientation="vertical" decorative />
			<IconButton icon="volume-high" label="Volume" box="sm" />
		</Toolbar>
	</Stack>
{/each}
