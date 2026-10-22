<script module>
	export const meta = {
		title: 'Slots',
		caption: 'Only children is required; header, status and composer each add a fixed row around the flexing feed.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { ChatBubble, Composer, ConversationFeed, ConversationPanel, StatusBar, Text } from '@dorsk/tsumikit';
	import { messages } from './data';

	const items = messages.slice(0, 2);
	let draft = $state('');
</script>

{#snippet feed()}
	<ConversationFeed {items} key={(m) => m.id}>
		{#snippet item(m)}<ChatBubble role={m.role} markdown={m.text} />{/snippet}
	</ConversationFeed>
{/snippet}

<div class="cell">
	<ConversationPanel style="height: 100%">{@render feed()}</ConversationPanel>
</div>
<div class="cell">
	<ConversationPanel style="height: 100%">
		{#snippet header()}<Text weight="medium">Header only</Text>{/snippet}
		{@render feed()}
		{#snippet status()}<StatusBar tone="idle" label="Status row" />{/snippet}
	</ConversationPanel>
</div>
<div class="cell">
	<ConversationPanel style="height: 100%">
		{#snippet header()}<Text weight="medium">All four</Text>{/snippet}
		{@render feed()}
		{#snippet status()}<StatusBar tone="ok" label="Connected" />{/snippet}
		{#snippet composer()}<Composer bind:value={draft} onsubmit={() => (draft = '')} />{/snippet}
	</ConversationPanel>
</div>

<style>
	.cell {
		height: 16rem;
		min-width: 0;
	}
</style>
