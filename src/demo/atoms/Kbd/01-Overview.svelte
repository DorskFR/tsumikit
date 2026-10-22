<script module>
	export const meta = {
		title: 'Shortcut cheat sheet',
		caption: 'keys="mod+k" style strings; the modifier glyphs follow the platform.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Card, Cluster, Heading, Kbd, Stack, Text } from '@dorsk/tsumikit';

	const shortcuts = [
		{ keys: 'mod+k', action: 'Open the command palette' },
		{ keys: 'mod+enter', action: 'Send the message' },
		{ keys: 'shift+enter', action: 'New line in the composer' },
		{ keys: 'mod+shift+f', action: 'Search across conversations' },
		{ keys: 'esc', action: 'Close the panel' },
		{ keys: 'alt+up', action: 'Move the item up' }
	];
</script>

<Card maxWidth="26rem">
	<Stack gap="var(--sp-3)">
		<Heading level={3} size="sm">Keyboard shortcuts</Heading>
		{#each shortcuts as s (s.keys)}
			<Cluster justify="space-between">
				<Text size="sm">{s.action}</Text>
				<Kbd keys={s.keys} />
			</Cluster>
		{/each}
	</Stack>
</Card>
