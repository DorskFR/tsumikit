<script module>
	export const meta = {
		title: 'Review comment',
		caption: 'autoresize grows with the text up to maxHeight; submitOn="mod-enter" posts, Shift+Enter still breaks lines.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Field, Kbd, Text, Textarea, toasts } from '@dorsk/tsumikit';

	let comment = $state('');
	let posted = $state<string[]>([]);
	function post(v: string | SubmitEvent) {
		if (typeof v !== 'string' || !v.trim()) return;
		posted = [...posted, v.trim()];
		comment = '';
		toasts.show('Comment posted');
	}
</script>

<div style="max-width: 32rem">
	<Field label="Leave a review comment">
		{#snippet hint()}<Kbd keys="mod+enter" /> to post.{/snippet}
		<Textarea bind:value={comment} autoresize rows={2} maxHeight="10rem" placeholder="Looks good, but…" submitOn="mod-enter" onsubmit={post} />
	</Field>
	<Cluster justify="flex-end" style="margin-top: var(--sp-2)">
		<Button variant="primary" size="sm" disabled={!comment.trim()} onclick={() => post(comment)}>Post</Button>
	</Cluster>
	{#each posted as p, i (i)}
		<Text as="p" size="sm" tone="muted" style="white-space: pre-wrap">{p}</Text>
	{/each}
</div>
