<script module>
	export const meta = {
		title: 'Type scale',
		caption: 'Heading level 1–4 and Text size xs → 2xl map onto the --fs-* tokens; every step scales with --fs-scale.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Divider, Heading, Text } from '@dorsk/tsumikit';

	const sizes = ['2xl', 'xl', 'lg', 'md', 'base', 'sm', 'xs'] as const;
</script>

<Heading level={1}>Release 0.75 is out</Heading>
<Heading level={2}>What changed in the conversation feed</Heading>
<Heading level={3}>Scroll anchoring and load-more</Heading>
<Heading level={4}>Known issues</Heading>
<Divider />
{#each sizes as size (size)}
	<div class="row">
		<Text size="xs" tone="faint" mono>--fs-{size}</Text>
		<Text {size}>The quick brown fox jumps over the lazy dog</Text>
	</div>
{/each}

<style>
	.row {
		display: grid;
		grid-template-columns: 6rem 1fr;
		align-items: baseline;
		gap: var(--sp-3);
	}
</style>
