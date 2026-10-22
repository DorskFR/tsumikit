<script module>
	export const meta = {
		title: 'Workspace icon',
		caption: 'value highlights the current glyph in the grid; onselect receives the pick; the Avatar preview and the name field update together.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Avatar, Cluster, EmojiPicker, Field, Input, Text } from '@dorsk/tsumikit';

	let emoji = $state('🦉');
	let name = $state('Platform team');
</script>

<Cluster align="center">
	<Avatar glyph={emoji} name={name} hue={210} size="lg" />
	<EmojiPicker value={emoji} label="Change the workspace icon" onselect={(e) => (emoji = e)} />
	<Field label="Workspace name" grow>
		<Input bind:value={name} />
	</Field>
</Cluster>
<Text size="xs" tone="muted">Search the built-in catalogue in English or French, or browse it by group. Arrow keys walk the grid, Enter picks.</Text>
