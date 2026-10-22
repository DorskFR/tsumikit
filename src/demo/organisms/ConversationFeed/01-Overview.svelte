<script module>
	export const meta = {
		title: 'Live deploy log',
		caption: 'item renders each entry; follow keeps the feed pinned while you are at the bottom. Scroll up, stream more and the "Jump to latest" pill appears; bind:this exposes scrollToBottom().',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, ConversationFeed, Dot, Text } from '@dorsk/tsumikit';
	import { event, firstEvents, type DeployEvent } from './data';

	let items = $state<DeployEvent[]>(firstEvents(6));
	let feed = $state<ReturnType<typeof ConversationFeed<DeployEvent>>>();
	let streaming = $state(false);

	$effect(() => {
		if (!streaming) return;
		const timer = setInterval(() => (items = [...items, event(items.length)]), 700);
		return () => clearInterval(timer);
	});

	const color = { info: 'var(--text-faint)', ok: 'var(--ok)', warn: 'var(--warn)', danger: 'var(--danger)' };
</script>

<div class="log">
	<ConversationFeed bind:this={feed} {items} key={(e) => e.id} label="Deploy log">
		{#snippet item(e)}
			<div class="line">
				<Dot color={color[e.level]} label={e.level} />
				<Text size="xs" tone="muted" mono>{e.at}</Text>
				<Text size="sm" mono>{e.text}</Text>
			</div>
		{/snippet}
	</ConversationFeed>
</div>
<Cluster>
	<Button size="sm" variant={streaming ? 'danger' : 'primary'} onclick={() => (streaming = !streaming)}>{streaming ? 'Pause stream' : 'Stream events'}</Button>
	<Button size="sm" onclick={() => (items = [...items, event(items.length)])}>Append one</Button>
	<Button size="sm" variant="ghost" onclick={() => feed?.scrollToBottom('smooth')}>scrollToBottom()</Button>
</Cluster>

<style>
	.log {
		display: flex;
		flex-direction: column;
		height: 14rem;
		border: 1px solid var(--border);
		border-radius: var(--r-md);
	}
	.line {
		display: flex;
		align-items: baseline;
		gap: var(--sp-2);
		min-width: 0;
		overflow-wrap: anywhere;
	}
</style>
