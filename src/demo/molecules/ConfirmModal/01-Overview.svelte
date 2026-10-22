<script module>
	export const meta = {
		title: 'Delete a project with typed confirmation',
		caption: 'tone="danger", children host an Input that must match the name; the async onconfirm busies the dialog until it settles.',
	};
</script>

<script lang="ts">
	import { Button, ConfirmModal, Field, Input, Text, toasts } from '@dorsk/tsumikit';

	const project = 'billing-api';
	let open = $state(false);
	let typed = $state('');
	const matches = $derived(typed.trim() === project);

	async function remove() {
		if (!matches) throw new Error(`Type ${project} to confirm.`);
		await new Promise((r) => setTimeout(r, 900));
		typed = '';
		toasts.ok(`${project} deleted`);
	}
</script>

<Button variant="danger" onclick={() => (open = true)}>Delete project…</Button>

<ConfirmModal bind:open title="Delete {project}?" tone="danger" confirmLabel="Delete project" onconfirm={remove} oncancel={() => (typed = '')}>
	<Text size="sm">This removes the repository, 3 environments and 14 days of logs. There is no undo.</Text>
	<Field label="Type the project name to continue" for="confirm-name">
		<Input id="confirm-name" bind:value={typed} placeholder={project} mono invalid={typed.length > 0 && !matches} />
	</Field>
</ConfirmModal>
