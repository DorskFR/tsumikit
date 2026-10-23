<script module>
	export const meta = {
		title: 'Tap-sized and wrapping links',
		caption: 'The sweep line and the highlight follow the text, line by line, whatever padding, min-height or display the app gives the link.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Link, Text } from '@dorsk/tsumikit';

	const variants = ['sweep', 'highlight'] as const;
</script>

{#each variants as v (v)}
	<div class="taps" data-fx-link={v}>
		<Text size="sm" tone="muted" mono>data-fx-link="{v}"</Text>
		<div><Link href="#link" class="tap">Exam tasks</Link></div>
		<div><Link href="#link" class="tap" underline="always">https://example.org/sources/a-long-reference-url-that-wraps</Link></div>
		<Text>
			A link inside prose <Link href="#link" underline="always">wraps across lines and keeps its line under every one of them</Link> as the sentence continues.
		</Text>
	</div>
{/each}

<style>
	.taps {
		max-width: 16rem;
		> div {
			padding-inline: var(--sp-1);
		}
	}
	.taps :global(a.tap) {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target);
		padding-block: var(--sp-2);
		overflow-wrap: anywhere;
	}
</style>
