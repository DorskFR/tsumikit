<script module>
	export const meta = {
		title: 'Semantic elements',
		caption: 'as="ol" keeps list semantics for an ordered checklist; as="form" spaces fields and submits natively.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Button, Input, Stack, Text, toasts } from '@dorsk/tsumikit';

	const steps = ['Rotate the API key', 'Update the CI secret', 'Revoke the old key'];
</script>

<Stack as="ol" gap="var(--sp-2)" style="padding-inline-start: var(--sp-5); margin: 0">
	{#each steps as step (step)}
		<li><Text>{step}</Text></li>
	{/each}
</Stack>
<Stack
	as="form"
	gap="var(--sp-2)"
	onsubmit={(e: SubmitEvent) => {
		e.preventDefault();
		toasts.show('Invite sent');
	}}
>
	<Input type="email" placeholder="teammate@example.com" aria-label="Email" required />
	<Button type="submit" variant="primary">Send invite</Button>
</Stack>
