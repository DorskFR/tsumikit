<script module>
	export const meta = {
		title: 'States',
		caption: 'empty snippet with no items, follow={false} for a history view that never auto-scrolls, and custom label / jumpLabel / loadMore="done".',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { ChatBubble, ConversationFeed, EmptyState } from '@dorsk/tsumikit';
	import { messages, type Message } from '../../fixtures';

	const none: Message[] = [];
</script>

<div class="frame">
	<ConversationFeed items={none} key={(m) => m.id}>
		{#snippet item(m)}<ChatBubble role={m.role} markdown={m.text} />{/snippet}
		{#snippet empty()}
			<EmptyState size="inline" title="No messages yet" description="Messages from the worker appear here." />
		{/snippet}
	</ConversationFeed>
</div>
<div class="frame">
	<ConversationFeed
		items={messages}
		key={(m) => m.id}
		follow={false}
		loadMore="done"
		label="Archived session"
		jumpLabel="Newest"
	>
		{#snippet item(m)}<ChatBubble role={m.role} markdown={m.text} clamp={4} />{/snippet}
	</ConversationFeed>
</div>

<style>
	.frame {
		display: flex;
		flex-direction: column;
		height: 16rem;
		min-width: 0;
		border: 1px solid var(--border);
		border-radius: var(--r-md);
	}
</style>
