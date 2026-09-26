<script lang="ts">
	import ChatBubble from '../../src/lib/components/molecules/ChatBubble.svelte';
	import Composer from '../../src/lib/components/molecules/Composer.svelte';
	import StatusBar from '../../src/lib/components/molecules/StatusBar.svelte';
	import ConversationFeed from '../../src/lib/components/organisms/ConversationFeed.svelte';
	import ConversationPanel from '../../src/lib/components/organisms/ConversationPanel.svelte';

	type Msg = { id: number; text: string };

	let {
		items = [],
		loadMore,
		follow = true,
		tone = 'idle',
		toolbar = false,
		onloadmore,
		feed = $bindable()
	}: {
		items?: Msg[];
		loadMore?: 'idle' | 'loading' | 'error' | 'done';
		follow?: boolean;
		tone?: 'idle' | 'busy' | 'ok' | 'warn' | 'error';
		toolbar?: boolean;
		onloadmore?: () => void;
		feed?: ReturnType<typeof ConversationFeed<Msg>>;
	} = $props();
</script>

{#snippet start()}<button type="button" id="pick">Pick</button>{/snippet}

<ConversationPanel>
	{#snippet header()}<span id="hdr">Header</span>{/snippet}
	<ConversationFeed bind:this={feed} {items} key={(m) => m.id} {loadMore} {onloadmore} {follow}>
		{#snippet item(m, i)}
			<ChatBubble role={i % 2 ? 'assistant' : 'user'} timestamp={0} markdown={m.text}>
				{#snippet footer()}<span class="ft">{m.id}</span>{/snippet}
			</ChatBubble>
		{/snippet}
		{#snippet empty()}<p id="empty">Nothing</p>{/snippet}
	</ConversationFeed>
	{#snippet status()}<StatusBar {tone} label="Status {tone}" />{/snippet}
	{#snippet composer()}
		<Composer onsubmit={() => {}} onfiles={() => {}} toolbarStart={toolbar ? start : undefined} />
	{/snippet}
</ConversationPanel>
