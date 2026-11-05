<script module>
	export const meta = {
		title: 'Save, publish and delete with undo',
		caption:
			'mount one <Toaster /> at the app root (this page already does); call toasts.show/ok/error/info from anywhere. toasts.undo applies the change at once, offers Undo while the toast is visible and commits when it goes away; a failed commit reverts and explains.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Text, toasts } from '@dorsk/tsumikit';

	let inbox = $state([
		{ id: 1, subject: 'Invoice #4821 is ready' },
		{ id: 2, subject: 'Build 0.82 passed on main' },
		{ id: 3, subject: 'Weekly digest: 14 new issues' },
		{ id: 4, subject: 'Your export finished' }
	]);

	function remove(id: number, failing = false) {
		const index = inbox.findIndex((m) => m.id === id);
		const message = inbox[index];
		if (!message) return;
		toasts.undo({
			message: `Deleted “${message.subject}”`,
			apply: () => {
				inbox = inbox.filter((m) => m.id !== id);
			},
			revert: () => {
				inbox = [...inbox.slice(0, index), message, ...inbox.slice(index)];
			},
			commit: async () => {
				await new Promise((r) => setTimeout(r, 300));
				if (failing) throw new Error('offline');
			}
		});
	}
</script>

<Cluster>
	<Button onclick={() => toasts.show('Draft saved')}>Save draft</Button>
	<Button variant="primary" onclick={() => toasts.ok('Changes published to 3 environments')}>Publish</Button>
	<Button variant="danger" onclick={() => toasts.error('Deploy failed: health check timed out after 30 s')}>Deploy (fails)</Button>
</Cluster>
{#if inbox.length}
	<ul class="inbox">
		{#each inbox as m (m.id)}
			<li>
				<Text size="sm" truncate>{m.subject}</Text>
				<Button size="sm" variant="ghost" onclick={() => remove(m.id)}>Delete</Button>
				<Button size="sm" variant="ghost" hoverDanger onclick={() => remove(m.id, true)}>Delete (offline)</Button>
			</li>
		{/each}
	</ul>
{:else}
	<Text size="sm" tone="muted">Inbox empty. Undo a deletion from its toast to bring a message back.</Text>
{/if}

<style>
	.inbox {
		display: grid;
		gap: var(--sp-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: var(--sp-2);
	}
</style>
