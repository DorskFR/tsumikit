<script module>
	export const meta = {
		title: 'Info, resolved and overflow',
		caption: 'An info item with href; a resolved item renders its state label and no actions; actions past the second go into the "…" menu.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { NotificationItem, toasts } from '@dorsk/tsumikit';

	const now = Date.now();
</script>

<NotificationItem
	tone="info"
	title="Nightly backup finished"
	text="3.2 GB written to the cold tier in 4 min."
	time={now - 2 * 3_600_000}
	href="https://example.com/backups"
	unread
/>
<NotificationItem
	tone="success"
	icon="key-round"
	title="Rotate the deploy token"
	time={now - 26 * 3_600_000}
	state="Approved on phone"
	actions={[{ id: 'approve', label: 'Approve' }]}
/>
<NotificationItem
	tone="danger"
	title="Disk almost full on build-runner-3 with a very long hostname that has to truncate"
	text="98% used."
	time={now - 9 * 60_000}
	actions={[
		{ id: 'open', label: 'Open', variant: 'primary' },
		{ id: 'snooze', label: 'Snooze 1h' },
		{ id: 'mute', label: 'Mute this runner' },
		{ id: 'delete', label: 'Delete', variant: 'danger', requiresConfirm: true }
	]}
	onaction={(id) => toasts.info(`Action: ${id}`)}
	ondismiss={() => toasts.info('Dismissed')}
/>
