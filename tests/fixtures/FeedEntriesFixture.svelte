<script lang="ts">
	import ConversationFeed from '../../src/lib/components/organisms/ConversationFeed.svelte';

	let { count = 12 }: { count?: number } = $props();
	const items = $derived(Array.from({ length: count }, (_, i) => ({ id: i })));
</script>

<ConversationFeed {items} key={(m) => m.id}>
	{#snippet item(m)}<div class="entry" data-id={m.id}>Message {m.id}</div>{/snippet}
</ConversationFeed>
