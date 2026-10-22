<script module>
	export const meta = {
		title: 'Controls, dots and autoplay',
		caption: 'dots={false}, controls={false} with counter, and loop + autoplay (ms) that pauses on hover and focus.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Card, Carousel, Text } from '@dorsk/tsumikit';

	const tips = [
		'Swipe left or right on a touch screen to change slide.',
		'←/→ step one slide; Home and End jump to the edges.',
		'The slide transition is dropped under prefers-reduced-motion.'
	];
</script>

<Carousel slides={tips} dots={false} label="Arrows only">
	{#snippet slide(tip)}<Card><Text size="sm">{tip}</Text></Card>{/snippet}
</Carousel>
<Carousel slides={tips} controls={false} counter label="Dots and counter">
	{#snippet slide(tip)}<Card><Text size="sm">{tip}</Text></Card>{/snippet}
</Carousel>
<Carousel slides={tips} loop autoplay={4000} label="Auto-rotating tips">
	{#snippet slide(tip, i)}<Card tone={i % 2 ? 'accent' : 'neutral'}><Text size="sm">{tip}</Text></Card>{/snippet}
</Carousel>
