<script module>
	export const meta = {
		title: 'States',
		caption: 'a single slide disables both arrows; a tall slide sets the height; onchange reports the new index.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Card, Carousel, Text } from '@dorsk/tsumikit';

	const one = ['Only one release note this week: nothing changed.'];
	const mixed = [
		'Short.',
		'A long slide: the deck grows to the tallest visible slide, so neighbours of different heights do not make the controls jump around while the user pages through them. '.repeat(3),
		'Short again.'
	];
	let last = $state(0);
</script>

<Carousel slides={one} counter label="Single slide">
	{#snippet slide(text)}<Card><Text size="sm">{text}</Text></Card>{/snippet}
</Carousel>
<Carousel slides={mixed} counter label="Mixed heights" onchange={(i) => (last = i)}>
	{#snippet slide(text)}<Card><Text size="sm">{text}</Text></Card>{/snippet}
</Carousel>
<Text size="xs" tone="muted">onchange → {last}</Text>
