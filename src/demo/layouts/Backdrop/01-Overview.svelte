<script module>
	export const meta = {
		title: 'Album page header',
		caption: 'src, alt, height: the picture fades into --bg at the bottom; title and actions sit on the scrim.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Backdrop, Badge, Button, Cluster, Heading, Stack, Text } from '@dorsk/tsumikit';
	import { tracks } from '../../fixtures';

	const album = tracks[0];
</script>

<Backdrop as="header" src="https://picsum.photos/seed/neonrain/1200/600" alt="" height="18rem">
	<Stack gap="var(--sp-2)">
		<Cluster gap="var(--sp-2)" align="center">
			<Badge tone="accent">Album</Badge>
			<Text size="sm" tone="muted">2026 · 9 tracks</Text>
		</Cluster>
		<Heading level={2}>{album.album}</Heading>
		<Text tone="muted">{album.artist}</Text>
		<Cluster gap="var(--sp-2)">
			<Button variant="primary">Play</Button>
			<Button variant="ghost">Shuffle</Button>
		</Cluster>
	</Stack>
</Backdrop>
