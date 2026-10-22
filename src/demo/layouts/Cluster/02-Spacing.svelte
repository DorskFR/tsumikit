<script module>
	export const meta = {
		title: 'Gap and alignment',
		caption: 'gap, align and justify take any CSS value; the striped background is the gap itself.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Cluster, Stack, Text } from '@dorsk/tsumikit';

	const rows = [
		{ gap: 'var(--sp-1)', align: 'center', justify: 'flex-start' },
		{ gap: 'var(--sp-3)', align: 'center', justify: 'flex-start' },
		{ gap: 'var(--sp-2)', align: 'flex-end', justify: 'center' },
		{ gap: 'var(--sp-2)', align: 'center', justify: 'space-between' }
	];
</script>

{#each rows as row (row.gap + row.align + row.justify)}
	<Stack gap="var(--sp-1)">
		<Text size="xs" mono tone="muted">gap="{row.gap}" align="{row.align}" justify="{row.justify}"</Text>
		<Cluster {...row} class="cluster-gap">
			<Badge>billing</Badge>
			<Badge size="md">eu-west-1</Badge>
			<Badge size="xs">canary</Badge>
			<Badge>v2.14.0</Badge>
		</Cluster>
	</Stack>
{/each}

<style>
	:global(.cluster-gap) {
		background: repeating-linear-gradient(
			-45deg,
			color-mix(in srgb, var(--accent) 30%, transparent) 0 4px,
			transparent 4px 8px
		);
	}
</style>
