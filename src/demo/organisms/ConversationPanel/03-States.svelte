<script module>
	export const meta = {
		title: 'States',
		caption: 'An empty session with an EmptyState, and an ended one: StatusBar tone="error" with a disabled Composer and a long header that truncates.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Badge, Button, ChatBubble, Composer, ConversationFeed, ConversationPanel, EmptyState, StatusBar, Text } from '@dorsk/tsumikit';
	import { messages, type Message } from './data';

	const none: Message[] = [];
	let draft = $state('');
</script>

<div class="cell">
	<ConversationPanel style="height: 100%">
		{#snippet header()}<Text weight="medium">New session</Text>{/snippet}
		<ConversationFeed items={none} key={(m) => m.id}>
			{#snippet item(m)}<ChatBubble role={m.role} markdown={m.text} />{/snippet}
			{#snippet empty()}
				<EmptyState size="inline" icon="send" title="No messages yet" description="Ask about a release, a log or a failing test." />
			{/snippet}
		</ConversationFeed>
		{#snippet composer()}<Composer bind:value={draft} onsubmit={() => (draft = '')} placeholder="Start the conversation…" />{/snippet}
	</ConversationPanel>
</div>
<div class="cell">
	<ConversationPanel style="height: 100%">
		{#snippet header()}
			<Text weight="medium" truncate grow>Overnight migration batch for the analytics warehouse rebuild on cyberia-k3s</Text>
			<Badge size="xs" tone="danger">ended</Badge>
		{/snippet}
		<ConversationFeed items={messages.slice(0, 3)} key={(m) => m.id}>
			{#snippet item(m)}<ChatBubble role={m.role} markdown={m.text} />{/snippet}
		</ConversationFeed>
		{#snippet status()}
			<StatusBar tone="error" label="Worker disconnected">
				{#snippet trailing()}<Button size="sm" variant="ghost">Reconnect</Button>{/snippet}
			</StatusBar>
		{/snippet}
		{#snippet composer()}<Composer value="" onsubmit={() => {}} disabled placeholder="Session ended" />{/snippet}
	</ConversationPanel>
</div>

<style>
	.cell {
		height: 22rem;
		min-width: 0;
	}
</style>
