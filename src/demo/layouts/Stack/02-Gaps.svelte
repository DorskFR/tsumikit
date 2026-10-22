<script module>
	export const meta = {
		title: 'Gap scale',
		caption: 'gap takes any CSS length; the striped background is the gap itself.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Stack, Text } from '@dorsk/tsumikit';

	const gaps = ['0', 'var(--sp-1)', 'var(--sp-2)', 'var(--sp-3)', 'var(--sp-4)', 'var(--sp-6)'];
</script>

{#each gaps as gap (gap)}
	<Stack gap="var(--sp-1)">
		<Text size="xs" mono tone="muted">{gap}</Text>
		<Stack {gap} class="gap-overlay">
			<div class="block">Header</div>
			<div class="block">Body</div>
			<div class="block">Footer</div>
		</Stack>
	</Stack>
{/each}

<style>
	:global(.gap-overlay) {
		background: repeating-linear-gradient(
			-45deg,
			color-mix(in srgb, var(--accent) 30%, transparent) 0 4px,
			transparent 4px 8px
		);
	}
	.block {
		padding: var(--sp-1) var(--sp-2);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--r-sm);
		font-size: var(--fs-xs);
	}
</style>
