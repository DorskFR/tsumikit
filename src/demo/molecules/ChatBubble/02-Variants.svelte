<script module>
	export const meta = {
		title: 'Roles and alignment',
		caption: 'role="user" | "assistant" | "system" | "tool" | "mcp" tints the bubble and pill; roleLabel renames the pill; align overrides the side.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { ChatBubble } from '@dorsk/tsumikit';
</script>

<ChatBubble role="user" markdown="Rerun the failing test on worker-02." />
<ChatBubble role="assistant" markdown="Rerunning `tests/demo-render.test.js`…" />
<ChatBubble role="tool" roleLabel="Bash" markdown="`node --test tests/demo-render.test.js` → 3 passed" />
<ChatBubble role="mcp" roleLabel="youtrack" markdown="Updated **TSU-251** to *In progress*." />
<ChatBubble role="system" markdown="Context compacted (184k → 22k tokens)." />
<ChatBubble role="user" align="start" roleLabel="Amara" markdown="Group chats keep everyone on the start side." />
