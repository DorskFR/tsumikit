<script module>
	export const meta = {
		title: 'Sizes and alignment',
		caption: 'size="sm" | "md" | "lg" with a matching box button; align="center" for a single-line Input, "end" (default) pins adornments to a growing textarea.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Icon, Input, InputGroup, Textarea, toasts } from '@dorsk/tsumikit';

	let email = $state('');
</script>

<div class="list">
	<InputGroup align="center">
		<Input bind:value={email} type="email" placeholder="Invite by email" aria-label="Invite by email" />
		{#snippet trailing()}
			<Button variant="primary" size="sm" onclick={() => toasts.show(`Invited ${email || 'nobody'}`)}>Invite</Button>
		{/snippet}
	</InputGroup>
	<InputGroup size="sm" align="center">
		<Input placeholder="Jump to service" aria-label="Jump to service" />
		{#snippet trailing()}<Button variant="primary" box="xs" icon aria-label="Go"><Icon name="arrow-right" size={12} /></Button>{/snippet}
	</InputGroup>
	<InputGroup size="md" align="center">
		<Input placeholder="Search runbooks" aria-label="Search runbooks" />
		{#snippet trailing()}<Button variant="primary" box="sm" icon aria-label="Go"><Icon name="arrow-right" size={14} /></Button>{/snippet}
	</InputGroup>
	<InputGroup size="lg" align="center">
		<Input placeholder="Paste an incident link" aria-label="Incident link" />
		{#snippet trailing()}<Button variant="primary" box="lg" icon aria-label="Go"><Icon name="arrow-right" size={16} /></Button>{/snippet}
	</InputGroup>
	<InputGroup>
		{#snippet leading()}<Button variant="ghost" box="sm" icon aria-label="Emoji">😊</Button>{/snippet}
		<Textarea autoresize rows={2} placeholder="Comment on this change" aria-label="Comment" />
		{#snippet trailing()}<Button variant="primary" size="sm">Comment</Button>{/snippet}
	</InputGroup>
</div>

<style>
	.list {
		display: grid;
		gap: var(--sp-3);
		max-width: 32rem;
	}
</style>
