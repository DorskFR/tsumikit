<script module>
	export const meta = {
		title: 'Message actions',
		caption: 'icon with label; pressed and filled paint a pin toggle; hoverDanger tints delete on hover; inline drops the box for a chip remove.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Cluster, IconButton, Text, toasts } from '@dorsk/tsumikit';

	let pinned = $state(false);
	let tags = $state(['deploy', 'eu-west-1', 'api-gateway']);
</script>

<div class="message">
	<Text size="sm">Rolled back api-gateway to 2.13 after the error budget alert.</Text>
	<Cluster gap="var(--sp-0-5)">
		<IconButton icon="reply" label="Reply" onclick={() => toasts.show('Replying')} />
		<IconButton icon="quote" label="Quote" onclick={() => toasts.show('Quoting')} />
		<IconButton icon="copy" label="Copy text" onclick={() => toasts.ok('Copied')} />
		<IconButton icon="pin" label={pinned ? 'Unpin' : 'Pin'} pressed={pinned} filled={pinned} onclick={() => (pinned = !pinned)} />
		<IconButton icon="trash" label="Delete" hoverDanger onclick={() => toasts.error('Deleted')} />
	</Cluster>
	<Cluster gap="var(--sp-1)">
		{#each tags as tag (tag)}
			<Badge>
				{tag}
				<IconButton icon="x" label="Remove {tag}" inline size={12} onclick={() => (tags = tags.filter((t) => t !== tag))} />
			</Badge>
		{/each}
	</Cluster>
</div>

<style>
	.message {
		display: grid;
		gap: var(--sp-2);
		max-width: 28rem;
	}
</style>
