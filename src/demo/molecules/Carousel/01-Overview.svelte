<script module>
	export const meta = {
		title: 'Featured albums',
		caption: 'slides is any array, slide is a snippet of (item, index); bind:index, dots and counter.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Carousel, Heading, Text } from '@dorsk/tsumikit';
	import { tracks } from '../../fixtures';

	let index = $state(0);
</script>

<Carousel slides={tracks} bind:index counter label="Featured tracks">
	{#snippet slide(track)}
		<article class="feature" style:--hue={track.hue}>
			<div class="art" aria-hidden="true"></div>
			<div class="body">
				<Text variant="eyebrow" tone="muted">{track.album}</Text>
				<Heading level={3} size="lg">{track.title}</Heading>
				<Text size="sm" tone="muted">{track.artist} · {Math.floor(track.durationS / 60)}:{String(track.durationS % 60).padStart(2, '0')}</Text>
				<Button size="sm" variant="primary" glyph="play">Play</Button>
			</div>
		</article>
	{/snippet}
</Carousel>

<style>
	.feature {
		display: flex;
		gap: var(--sp-4);
		align-items: center;
		padding: var(--sp-4);
		border-radius: var(--r-lg);
		background: color-mix(in srgb, hsl(var(--hue) 60% 50%) 14%, var(--bg-elevated));
	}
	.art {
		flex: none;
		width: 6rem;
		height: 6rem;
		border-radius: var(--r-md);
		background: linear-gradient(135deg, hsl(var(--hue) 70% 55%), hsl(calc(var(--hue) + 40) 70% 40%));
	}
	.body {
		display: grid;
		gap: var(--sp-1);
		justify-items: start;
		min-width: 0;
	}
</style>
