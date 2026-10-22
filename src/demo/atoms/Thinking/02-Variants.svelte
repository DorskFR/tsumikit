<script module>
	export const meta = {
		title: 'Dots and sheen text',
		caption: 'variant dots (currentColor) or sheen (text-muted to text sweep, accent caret); children replace the sheen word; caret={false} drops the cursor.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { ChatBubble, Cluster, Stack, Text, Thinking } from '@dorsk/tsumikit';
</script>

<Stack gap="var(--sp-2)">
	<ChatBubble role="user" markdown="Draft the release notes." />
	<ChatBubble role="assistant"><Thinking variant="sheen" /></ChatBubble>
	<ChatBubble role="assistant"><Thinking variant="sheen" caret={false}>Searching the changelog</Thinking></ChatBubble>
</Stack>
<Cluster align="center" gap="var(--sp-5)">
	<Text tone="muted"><Thinking /></Text>
	<Text tone="accent"><Thinking /></Text>
	<Text size="xl"><Thinking /></Text>
	<Thinking variant="sheen">Generating</Thinking>
</Cluster>
