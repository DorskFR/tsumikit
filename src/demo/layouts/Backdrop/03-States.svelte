<script module>
	export const meta = {
		title: 'Missing picture',
		caption: 'no src: the seeded Artwork placeholder carries the header; fallback="icon" for non-named subjects; long titles wrap on the scrim.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Backdrop, Heading, Text } from '@dorsk/tsumikit';
</script>

<Backdrop alt="Low Tide" height="11rem">
	<Heading level={3}>Low Tide</Heading>
	<Text size="sm" tone="muted">June Hollow · the cover has not been uploaded yet</Text>
</Backdrop>
<Backdrop alt="" seed="playlist-42" fallback="icon" height="11rem">
	<Heading level={3}>Late night focus</Heading>
	<Text size="sm" tone="muted">Playlist · 41 tracks · 2 h 58 min</Text>
</Backdrop>
<Backdrop src="https://picsum.photos/seed/lantern/1200/400" alt="" height="14rem">
	<Heading level={3}>
		A very long release title that keeps going well past the width of a phone, and then some more, to prove it wraps
	</Heading>
	<Text size="sm" tone="muted">Oro Valley · Lantern (Deluxe Edition, remastered, with liner notes)</Text>
</Backdrop>
