<script module>
	export const meta = {
		title: 'Edit profile',
		caption: 'bind:open controls visibility; body and footer snippets; focus lands on the first field and returns to the trigger on close.',
	};
</script>

<script lang="ts">
	import { Button, Field, Input, Modal, Select, Textarea, toasts } from '@dorsk/tsumikit';
	import { people } from '../../fixtures';

	let open = $state(false);
	let saving = $state(false);
	let form = $state({ name: people[0].name, role: people[0].role, tz: 'Europe/Berlin', bio: 'Keeps the platform boring.' });

	async function save() {
		saving = true;
		await new Promise((r) => setTimeout(r, 800));
		saving = false;
		open = false;
		toasts.ok('Profile updated');
	}
</script>

<Button variant="primary" onclick={() => (open = true)}>Edit profile</Button>

<Modal bind:open title="Edit profile" busy={saving}>
	{#snippet body()}
		<div class="form">
			<Field label="Display name" for="pf-name"><Input id="pf-name" bind:value={form.name} /></Field>
			<Field label="Role" for="pf-role"><Input id="pf-role" bind:value={form.role} /></Field>
			<Field label="Time zone" for="pf-tz">
				<Select id="pf-tz" bind:value={form.tz} options={[{ value: 'Europe/Berlin', label: 'Berlin (UTC+1)' }, { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' }, { value: 'America/New_York', label: 'New York (UTC−5)' }]} />
			</Field>
			<Field label="Bio" for="pf-bio" hint="Shown on your public card."><Textarea id="pf-bio" bind:value={form.bio} autoresize /></Field>
		</div>
	{/snippet}
	{#snippet footer()}
		<Button onclick={() => (open = false)}>Cancel</Button>
		<Button variant="primary" loading={saving} onclick={save}>Save changes</Button>
	{/snippet}
</Modal>

<style>
	.form {
		display: grid;
		gap: var(--sp-3);
	}
</style>
