<script module>
	export const meta = {
		title: 'Assistant session',
		caption: 'header, the ConversationFeed as children, a StatusBar in status and a Composer in composer; send a message, scroll up and load older ones.',
		layout: 'frame',
		height: '34rem'
	};
</script>

<script lang="ts">
	import { Badge, ChatBubble, Composer, ConversationFeed, ConversationPanel, StatusBar, Text } from '@dorsk/tsumikit';
	import { message, messages, older, type Message } from './data';

	let items = $state<Message[]>([...messages]);
	let more = $state<'idle' | 'loading' | 'done'>('idle');
	let draft = $state('');
	let busy = $state(false);

	function loadOlder() {
		more = 'loading';
		setTimeout(() => {
			items = [...older(items[0].at), ...items];
			more = items.length >= 13 ? 'done' : 'idle';
		}, 600);
	}

	function send(text: string) {
		items = [...items, message('user', text)];
		draft = '';
		busy = true;
		setTimeout(() => {
			items = [...items, message('assistant', `On it: **${text}**`)];
			busy = false;
		}, 900);
	}
</script>

<ConversationPanel style="height: 100%">
	{#snippet header()}
		<Text weight="medium" truncate grow>Release 0.62 · tsumikit</Text>
		<Badge size="xs" tone="ok" dot>live</Badge>
	{/snippet}
	<ConversationFeed {items} key={(m) => m.id} loadMore={more} onloadmore={loadOlder}>
		{#snippet item(m)}
			<ChatBubble role={m.role} timestamp={m.at} markdown={m.text} copyText={m.text}>
				{#snippet footer()}
					{#if m.ms}<span>{(m.ms / 1000).toFixed(1)}s</span>{/if}
				{/snippet}
			</ChatBubble>
		{/snippet}
	</ConversationFeed>
	{#snippet status()}
		<StatusBar tone={busy ? 'busy' : 'ok'} label={busy ? 'Assistant is typing…' : 'Ready'}>
			{#snippet trailing()}<span>{items.length} messages</span>{/snippet}
		</StatusBar>
	{/snippet}
	{#snippet composer()}
		<Composer bind:value={draft} {busy} onsubmit={send} placeholder="Reply…" />
	{/snippet}
</ConversationPanel>
