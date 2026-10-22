<script module>
	export const meta = {
		title: 'Typing dots in a reply bubble',
		caption: 'the default dots variant sits where the reply will appear; role=status with the label announces the busy state.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { ChatBubble, Stack, Thinking } from '@dorsk/tsumikit';
</script>

<Stack gap="var(--sp-2)">
	<ChatBubble role="user" markdown="Can you summarise the last meeting?" />
	<ChatBubble role="assistant"><Thinking label="Assistant is typing" /></ChatBubble>
</Stack>
