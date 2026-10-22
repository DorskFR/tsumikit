<script module>
	export const meta = {
		title: 'Save, publish and undo',
		caption: 'mount one <Toaster /> at the app root (this page already does); call toasts.show/ok/error/info from anywhere. An action keeps the toast longer.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Text, toasts } from '@dorsk/tsumikit';

	let archived = $state(0);

	function archive() {
		archived += 1;
		toasts.show('Conversation archived', {
			tone: 'ok',
			action: {
				label: 'Undo',
				run: async () => {
					await new Promise((r) => setTimeout(r, 600));
					archived -= 1;
				}
			}
		});
	}
</script>

<Text size="sm" tone="muted">{archived} archived</Text>
<Cluster>
	<Button onclick={() => toasts.show('Draft saved')}>Save draft</Button>
	<Button variant="primary" onclick={() => toasts.ok('Changes published to 3 environments')}>Publish</Button>
	<Button onclick={archive}>Archive</Button>
	<Button variant="danger" onclick={() => toasts.error('Deploy failed: health check timed out after 30 s')}>Deploy (fails)</Button>
</Cluster>
