<script module>
	export const meta = {
		title: 'Timed, sticky, stacking, long text, failing action',
		caption: 'duration in ms (0 = sticky until clicked or dismissed by id); a throwing action.run becomes an error toast; hover pauses the timer.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Text, toasts } from '@dorsk/tsumikit';

	let sticky = $state<number | null>(null);
	const count = $derived(toasts.items.length);

	function burst() {
		['worker-02 restarted', 'cache-01 warmed', 'api-gateway healthy', 'db-primary vacuumed'].forEach((m, i) =>
			setTimeout(() => toasts.info(m), i * 250)
		);
	}
</script>

<Cluster>
	<Button onclick={() => toasts.show('Gone in a second', { duration: 1000 })}>1 s</Button>
	<Button onclick={() => toasts.show('Stays for ten seconds', { duration: 10000 })}>10 s</Button>
	{#if sticky === null}
		<Button onclick={() => (sticky = toasts.show('Reconnecting to the server…', { tone: 'info', duration: 0 }))}>Sticky</Button>
	{:else}
		<Button variant="primary" onclick={() => { toasts.dismiss(sticky!); sticky = null; }}>Dismiss sticky</Button>
	{/if}
	<Button onclick={burst}>Burst of four</Button>
</Cluster>
<Cluster>
	<Button onclick={() => toasts.show('The export of 12,480 rows finished, but 37 rows were skipped because their timestamps could not be parsed; download the skipped list to fix them.')}>Long message</Button>
	<Button
		onclick={() =>
			toasts.show('Message deleted', {
				action: { label: 'Undo', run: () => Promise.reject(new Error('Undo failed: the message was already purged')) }
			})}
	>
		Failing undo
	</Button>
</Cluster>
<Text size="sm" tone="muted">{count} toast{count === 1 ? '' : 's'} on screen</Text>
