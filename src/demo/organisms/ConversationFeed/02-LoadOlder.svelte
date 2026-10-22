<script module>
	export const meta = {
		title: 'Load older history',
		caption: 'loadMore drives the top pill (idle → loading → done); onloadmore prepends and the viewport stays on the message you were reading. The third page fails once to show loadMore="error".',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { ChatBubble, ConversationFeed } from '@dorsk/tsumikit';
	import { messages, type Message } from '../../fixtures';

	let items = $state<Message[]>([...messages]);
	let status = $state<'idle' | 'loading' | 'error' | 'done'>('idle');
	let pages = 0;
	let failed = false;

	function loadOlder() {
		status = 'loading';
		setTimeout(() => {
			if (pages === 2 && !failed) {
				failed = true;
				status = 'error';
				return;
			}
			pages += 1;
			const first = items[0];
			const older = Array.from({ length: 3 }, (_, i) => ({
				id: first.id - 3 + i,
				role: i % 2 ? ('assistant' as const) : ('user' as const),
				text: `Page ${pages}, message ${i + 1}: earlier context about the 0.61 release.`,
				at: first.at - (3 - i) * 60_000,
			}));
			items = [...older, ...items];
			status = pages >= 4 ? 'done' : 'idle';
		}, 700);
	}
</script>

<div class="frame">
	<ConversationFeed {items} key={(m) => m.id} loadMore={status} onloadmore={loadOlder} loadMoreLabel="Load earlier messages">
		{#snippet item(m)}
			<ChatBubble role={m.role} timestamp={m.at} markdown={m.text} />
		{/snippet}
	</ConversationFeed>
</div>

<style>
	.frame {
		display: flex;
		flex-direction: column;
		height: 20rem;
		border: 1px solid var(--border);
		border-radius: var(--r-md);
	}
</style>
