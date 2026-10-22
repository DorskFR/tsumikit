<script module>
	export const meta = {
		title: 'Async confirm, failure and external busy',
		caption: 'a Promise from onconfirm shows loading and closes on resolve; a rejection surfaces its message and keeps the dialog open; busy forces the working state.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Checkbox, Cluster, ConfirmModal, toasts } from '@dorsk/tsumikit';

	let open = $state(false);
	let fails = $state(false);
	let attempts = $state(0);

	async function archive() {
		attempts += 1;
		await new Promise((r) => setTimeout(r, 1000));
		if (fails) throw new Error('Archive failed: the storage backend returned 503. Try again or cancel.');
		toasts.ok('Library archived');
	}
</script>

<Cluster align="center">
	<Button onclick={() => (open = true)}>Archive library…</Button>
	<Checkbox label="Make the confirm fail" bind:checked={fails} />
	<Button size="sm" variant="ghost" onclick={() => (attempts = 0)} disabled={attempts === 0}>Reset ({attempts} attempts)</Button>
</Cluster>

<ConfirmModal
	bind:open
	title="Archive this library?"
	message="Items stay searchable but stop syncing. You can restore it from Settings later."
	tone="warn"
	confirmLabel="Archive"
	cancelLabel="Keep syncing"
	onconfirm={archive}
/>
