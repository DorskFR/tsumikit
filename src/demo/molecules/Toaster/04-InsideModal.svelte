<script module>
	export const meta = {
		title: 'Over an open modal',
		caption: 'while a modal <dialog> is open the stack moves inside it so toasts stay visible and clickable, then returns to the root on close.',
	};
</script>

<script lang="ts">
	import { Button, Modal, Text, toasts } from '@dorsk/tsumikit';

	let open = $state(false);
</script>

<Button onclick={() => (open = true)}>Open modal</Button>

<Modal bind:open title="Invite members" size="sm">
	{#snippet body()}
		<Text>Fire a toast from inside: it renders over the dialog, not behind the inert backdrop.</Text>
	{/snippet}
	{#snippet footer()}
		<Button onclick={() => toasts.error('Invite failed: address already a member')}>Fail</Button>
		<Button variant="primary" onclick={() => toasts.ok('Invite sent')}>Send invite</Button>
	{/snippet}
</Modal>
