<script module>
	export const meta = {
		title: 'Approval with Approve / Reject',
		caption: 'Reject sets requiresConfirm and asks inline; onaction returns a promise, so the button stays pending until it settles, then the parent sets state.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, NotificationItem } from '@dorsk/tsumikit';

	let outcome = $state<string | undefined>();
	let unread = $state(true);
	const time = Date.now() - 4 * 60_000;

	function act(id: string) {
		return new Promise<void>((resolve) =>
			setTimeout(() => {
				outcome = id === 'approve' ? 'Approved by you' : 'Rejected by you';
				unread = false;
				resolve();
			}, 900)
		);
	}
</script>

<NotificationItem
	icon="lock"
	tone="warning"
	title="Deploy api@4.12.0 to production"
	text="The release pipeline is waiting for a second approval before it rolls out to the eu-west and us-east clusters."
	{time}
	{unread}
	state={outcome}
	actions={[
		{ id: 'approve', label: 'Approve', variant: 'primary' },
		{ id: 'reject', label: 'Reject', variant: 'danger', requiresConfirm: true }
	]}
	onaction={act}
/>
{#if outcome}
	<Button size="sm" variant="ghost" onclick={() => ((outcome = undefined), (unread = true))}>Reset</Button>
{/if}
