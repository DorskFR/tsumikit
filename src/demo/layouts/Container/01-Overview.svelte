<script module>
	export const meta = {
		title: 'Release notes page',
		caption: 'as="article" size="38rem" pad: a readable centered column with vertical breathing room.',
		layout: 'frame',
		height: '22rem'
	};
</script>

<script lang="ts">
	import { Badge, Cluster, Container, Heading, Stack, Text } from '@dorsk/tsumikit';
</script>

<Container as="article" size="38rem" pad>
	<Stack>
		<Cluster>
			<Badge tone="accent">v2.14</Badge>
			<Text size="sm" tone="muted">October 21, 2026</Text>
		</Cluster>
		<Heading level={2}>Faster cold starts and a calmer inbox</Heading>
		<Text as="p">
			Workers now keep a warm pool per region, so the first request after a deploy no longer waits
			for a container to boot. In our own fleet p95 cold start fell from 1.8 s to 240 ms.
		</Text>
		<Text as="p">
			Notification digests group alerts by service and collapse repeats within a five-minute
			window. Muted services stay muted across deploys.
		</Text>
		<Text as="p" tone="muted">
			Upgrading is a single version bump; no configuration changes are required.
		</Text>
	</Stack>
</Container>
