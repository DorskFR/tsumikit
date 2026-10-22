<script module>
	export const meta = {
		title: 'Profile settings form',
		caption: 'Field wires the label, hint and error; Input takes bind:value, icon, mono and type.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Field, Input, Stack, toasts } from '@dorsk/tsumikit';

	let name = $state('Amara Okafor');
	let handle = $state('amara');
	let email = $state('amara@example.com');
	let site = $state('');
	const handleError = $derived(/^[a-z0-9-]{3,}$/.test(handle) ? '' : 'Lowercase letters, digits and dashes, 3+ characters.');
</script>

<Stack gap="var(--sp-3)" style="max-width: 28rem">
	<Field label="Display name" hint="Shown on your profile and in mentions.">
		<Input bind:value={name} autocomplete="name" />
	</Field>
	<Field label="Handle" error={handleError}>
		<Input bind:value={handle} mono icon="user" spellcheck={false} />
	</Field>
	<Field label="Email">
		<Input bind:value={email} type="email" icon="mail" />
	</Field>
	<Field label="Website" hint="Optional.">
		<Input bind:value={site} type="url" placeholder="https://" icon="link" clearable />
	</Field>
	<Cluster justify="flex-end">
		<Button variant="ghost">Cancel</Button>
		<Button variant="primary" disabled={!!handleError} onclick={() => toasts.show('Profile saved')}>Save</Button>
	</Cluster>
</Stack>
