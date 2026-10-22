<script module>
	export const meta = {
		title: 'Levels, sizes and tones',
		caption: 'each level has a default size (h1 2xl → h6 xs); size overrides it without changing the tag.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Heading, Stack } from '@dorsk/tsumikit';

	const levels = [1, 2, 3, 4, 5, 6] as const;
	const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
</script>

<Stack gap="var(--sp-1)">
	{#each levels as level (level)}<Heading {level}>Heading level {level}</Heading>{/each}
</Stack>
<Cluster align="baseline">
	{#each sizes as size (size)}<Heading level={3} {size}>{size}</Heading>{/each}
</Cluster>
<Cluster align="baseline">
	<Heading level={3} tone="default">default</Heading>
	<Heading level={3} tone="muted">muted</Heading>
	<Heading level={3} tone="faint">faint</Heading>
	<Heading level={3} italic>italic</Heading>
	<Heading level={3} uppercase size="sm">uppercase</Heading>
</Cluster>
