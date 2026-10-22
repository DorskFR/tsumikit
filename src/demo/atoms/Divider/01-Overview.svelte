<script module>
	export const meta = {
		title: 'Sign-in form and action strip',
		caption: 'a labelled rule between two sign-in paths, and vertical decorative rules between toolbar actions.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Card, Cluster, Divider, Input, Stack } from '@dorsk/tsumikit';

	let email = $state('');
</script>

<Card maxWidth="22rem">
	<Stack gap="var(--sp-3)">
		<Button variant="primary" block>Continue with passkey</Button>
		<Divider>or with email</Divider>
		<Input placeholder="you@example.com" type="email" bind:value={email} />
		<Button block disabled={!email}>Send magic link</Button>
	</Stack>
</Card>
<Cluster gap="0">
	<Button size="sm" variant="ghost">Copy</Button>
	<Divider orientation="vertical" spacing="var(--sp-2)" decorative />
	<Button size="sm" variant="ghost">Rename</Button>
	<Divider orientation="vertical" spacing="var(--sp-2)" decorative />
	<Button size="sm" variant="ghost" tone="danger">Delete</Button>
</Cluster>
