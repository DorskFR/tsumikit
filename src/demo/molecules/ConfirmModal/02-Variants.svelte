<script module>
	export const meta = {
		title: 'Tones',
		caption: 'tone colours the confirm button and, for danger/warn/info, the Modal header; message is the one-line body.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, ConfirmModal, toasts } from '@dorsk/tsumikit';

	const cases = [
		{ tone: 'accent', label: 'Publish', title: 'Publish 3 drafts?', message: 'They become visible to all workspace members at once.', confirm: 'Publish' },
		{ tone: 'ok', label: 'Approve', title: 'Approve this deploy?', message: 'The release rolls out to 100% over the next 10 minutes.', confirm: 'Approve' },
		{ tone: 'info', label: 'Reschedule', title: 'Move the sync to tonight?', message: 'The 14:00 run is skipped and runs once at 02:00 instead.', confirm: 'Reschedule' },
		{ tone: 'warn', label: 'Force push', title: 'Force push to main?', message: 'Two commits on origin are not in your branch and will be lost.', confirm: 'Force push' },
		{ tone: 'danger', label: 'Revoke', title: 'Revoke all sessions?', message: 'Everyone, including you, is signed out immediately.', confirm: 'Revoke' },
		{ tone: 'neutral', label: 'Discard', title: 'Discard unsaved changes?', message: 'Your edits to the dashboard layout are lost.', confirm: 'Discard' }
	] as const;
	let active = $state<string | null>(null);
</script>

<Cluster align="center">
	{#each cases as c (c.tone)}
		<Button size="sm" onclick={() => (active = c.tone)}>{c.label}</Button>
	{/each}
</Cluster>

{#each cases as c (c.tone)}
	<ConfirmModal
		open={active === c.tone}
		title={c.title}
		message={c.message}
		tone={c.tone}
		confirmLabel={c.confirm}
		onconfirm={() => {
			toasts.show(`${c.confirm}: done`);
			active = null;
		}}
		oncancel={() => (active = null)}
	/>
{/each}
