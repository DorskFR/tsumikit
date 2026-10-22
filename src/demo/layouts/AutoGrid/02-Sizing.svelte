<script module>
	export const meta = {
		title: 'Column sizing modes',
		caption: 'Default auto-fit stretches columns to fill; max caps and left-packs them; fill keeps empty tracks; maxCols={2} never exceeds two; template bypasses all of it.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { AutoGrid, Stack, Text } from '@dorsk/tsumikit';

	const modes = [
		{ label: 'min="8rem"', props: { min: '8rem' } },
		{ label: 'min="8rem" max="10rem"', props: { min: '8rem', max: '10rem' } },
		{ label: 'min="8rem" fill', props: { min: '8rem', fill: true } },
		{ label: 'min="8rem" maxCols={2}', props: { min: '8rem', maxCols: 2 } },
		{ label: 'template="2fr 1fr"', props: { template: '2fr 1fr' } }
	];
</script>

{#each modes as mode (mode.label)}
	<Stack gap="var(--sp-1)">
		<Text size="xs" mono tone="muted">{mode.label}</Text>
		<AutoGrid {...mode.props} gap="var(--sp-2)" class="grid-gap">
			{#each ['Inbox', 'Drafts', 'Sent'] as cell (cell)}
				<div class="cell">{cell}</div>
			{/each}
		</AutoGrid>
	</Stack>
{/each}

<style>
	:global(.grid-gap) {
		background: repeating-linear-gradient(
			-45deg,
			color-mix(in srgb, var(--accent) 30%, transparent) 0 4px,
			transparent 4px 8px
		);
	}
	.cell {
		padding: var(--sp-2);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--r-sm);
		font-size: var(--fs-sm);
	}
</style>
