<script module>
	export const meta = {
		title: 'Variants',
		caption: 'variant icon, arc, dots, orbit, pulse, bars, grid, clock and bounce; clock and bounce read best at 20px and up.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Spinner, Stack, Text } from '@dorsk/tsumikit';

	const variants = ['icon', 'arc', 'dots', 'orbit', 'pulse', 'bars', 'grid', 'clock', 'bounce'] as const;
</script>

<Cluster gap="var(--sp-5)">
	{#each variants as variant (variant)}
		<Stack gap="var(--sp-2)" align="center">
			<Spinner {variant} size={28} label="Loading ({variant})" />
			<Text size="xs" tone="muted">{variant}</Text>
		</Stack>
	{/each}
</Cluster>
