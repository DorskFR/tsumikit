<script module>
	export const meta = {
		title: 'Micro-interactions',
		caption: 'data-fx-link on any ancestor: "sweep" (default) draws the underline in from the left, "highlight" swipes a marker behind the words, "none" keeps the plain underline. underline="none" links never animate.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Link, Text } from '@dorsk/tsumikit';

	const variants = ['sweep', 'highlight', 'none'] as const;
</script>

{#each variants as v (v)}
	<div data-fx-link={v}>
		<Text size="sm" tone="muted" mono>data-fx-link="{v}"</Text>
		<Text>
			Read the <Link href="#link" underline="always">motion guidelines</Link> before you ship, or browse the
			<Link href="#link">token reference</Link> and the <Link tone="info" href="#link">changelog</Link>.
		</Text>
	</div>
{/each}
