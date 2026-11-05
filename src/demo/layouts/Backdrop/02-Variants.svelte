<script module>
	export const meta = {
		title: 'Fade, blur and dim',
		caption: 'fade="none" keeps a hard bottom edge; blur softens the picture; dim tints it toward --bg beyond the scrim.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Backdrop, Heading, Text } from '@dorsk/tsumikit';

	const src = 'https://picsum.photos/seed/lowtide/800/500';
</script>

<Backdrop {src} alt="" height="12rem">
	<Heading level={3}>Fade into the page</Heading>
	<Text size="sm" tone="muted">fade="bottom" (default)</Text>
</Backdrop>
<Backdrop {src} alt="" height="12rem" fade="none">
	<Heading level={3}>Hard edge</Heading>
	<Text size="sm" tone="muted">fade="none"</Text>
</Backdrop>
<Backdrop {src} alt="" height="12rem" blur>
	<Heading level={3}>Softened</Heading>
	<Text size="sm" tone="muted">blur</Text>
</Backdrop>
<Backdrop {src} alt="" height="12rem" dim>
	<Heading level={3}>Darkened</Heading>
	<Text size="sm" tone="muted">dim</Text>
</Backdrop>
