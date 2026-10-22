<script module>
	export const meta = {
		title: 'Tones',
		caption: 'neutral, ok, info and error (danger is an alias); errors go to the assertive live region.',
	};
</script>

<script lang="ts">
	import { Button, toasts } from '@dorsk/tsumikit';
</script>

<Button onclick={() => toasts.show('Saved to drafts')}>Neutral</Button>
<Button tone="success" onclick={() => toasts.ok('Backup completed')}>ok</Button>
<Button tone="info" onclick={() => toasts.info('Sync scheduled for 02:00')}>info</Button>
<Button tone="danger" onclick={() => toasts.error('Payment declined')}>error</Button>
<Button onclick={() => toasts.show('Session expired', { tone: 'danger' })}>tone: "danger"</Button>
