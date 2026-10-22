<script module>
	export const meta = {
		title: 'Support thread',
		caption: 'markdown body, timestamp in the meta row, copyText adds a copy button, footer carries latency and tokens, actions holds per-message buttons.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, ChatBubble } from '@dorsk/tsumikit';

	const asked = Date.UTC(2026, 9, 21, 8, 41);
	const answer =
		'The 502s come from `cache-01`: it ran out of memory at **08:39** and restarted.\n\n1. Raise `maxmemory` to 6 GB\n2. Enable `allkeys-lru`\n\nWant me to open the PR?';
	let reaction = $state('');
</script>

<ChatBubble role="user" timestamp={asked} markdown="Why is the **api-gateway** returning 502s since this morning?" />
<ChatBubble role="assistant" timestamp={asked + 42_000} markdown={answer} copyText={answer}>
	{#snippet footer()}
		<span>2.4s</span><span>↓ 1.2k ↑ 214 tokens</span>
	{/snippet}
	{#snippet actions()}
		<Button size="sm" variant="ghost" pressed={reaction === 'up'} onclick={() => (reaction = 'up')}>Helpful</Button>
		<Button size="sm" variant="ghost">Open the PR</Button>
	{/snippet}
</ChatBubble>
