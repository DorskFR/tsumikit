<script module>
	export const meta = {
		title: 'Long content and overflow',
		caption: 'truncate clips to one line, wrap="anywhere" breaks long tokens, wrap="balance" evens the lines, measure caps the line length, nowrap keeps a phrase on one line.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Stack, Text } from '@dorsk/tsumikit';

	const path = '/var/lib/containers/storage/overlay/3f2a9c7e1b4d8a6f5e0c2b1a9d8e7f6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e/merged';
</script>

<Stack gap="var(--sp-3)" style="max-width: 24rem">
	<Text truncate block>Truncated: {path}</Text>
	<Text wrap="anywhere" mono size="sm" block>{path}</Text>
	<Text wrap="balance" size="lg" weight="semibold" block>Balanced wrapping keeps a two-line title from leaving a single orphan word on its own.</Text>
	<Text as="p" measure="40ch">A paragraph capped at forty characters per line stays readable however wide the panel grows around it.</Text>
	<Text as="p" size="sm">
		Last deploy finished <Text nowrap weight="medium">12 minutes ago</Text> and the rollout reached <Text nowrap weight="medium">3 of 4 regions</Text> before the pause; the figures stay on one line while the sentence wraps around them.
	</Text>
</Stack>
