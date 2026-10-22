<script module>
	export const meta = {
		title: 'Micro-interactions',
		caption: 'data-fx-copy on any ancestor: "burst" (default) springs the check in a ring of sparks, "tick" draws the tick and rolls the label, "none" swaps plainly.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, CopyButton, Text } from '@dorsk/tsumikit';

	const variants = ['burst', 'tick', 'none'] as const;
</script>

{#each variants as v (v)}
	<div data-fx-copy={v}>
		<Cluster align="center">
			<Text size="sm" tone="muted" mono>data-fx-copy="{v}"</Text>
			<CopyButton text="npm i @dorsk/tsumikit" box="md" />
			<CopyButton text="npm i @dorsk/tsumikit" />
			<CopyButton text="npm i @dorsk/tsumikit" variant="default" />
		</Cluster>
	</div>
{/each}
