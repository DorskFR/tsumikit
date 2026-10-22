<script module>
	export const meta = {
		title: 'Stacked piles and clipped media',
		caption: 'stacked draws two back layers, stackTone tints them, stackY and stackX set the peek; overflow="hidden" with padding="none" clips an image to the corners; maxWidth caps a row card.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Artwork, Card, Heading, Text } from '@dorsk/tsumikit';
	import { tracks } from '../../fixtures';
</script>

<Card stacked>
	<Heading level={3} size="sm">3 queued jobs</Heading>
	<Text size="sm" tone="muted">Back layers on the border colour.</Text>
</Card>
<Card stacked stackTone="info" stackY={6} stackX={6}>
	<Heading level={3} size="sm">Info pile, wider peek</Heading>
	<Text size="sm" tone="muted">Offsets are per layer.</Text>
</Card>
<Card stacked border="dashed" stackTone="warn">
	<Heading level={3} size="sm">Dashed pile</Heading>
	<Text size="sm" tone="muted">Back layers inherit the dash.</Text>
</Card>
<Card padding="none" overflow="hidden" maxWidth="14rem">
	<Artwork alt={tracks[0].album} seed={tracks[0].album} aspect="16/9" radius="sm" />
	<div style="padding: var(--sp-3)">
		<Text weight="medium" block>{tracks[0].title}</Text>
		<Text size="sm" tone="muted">{tracks[0].artist}</Text>
	</div>
</Card>
