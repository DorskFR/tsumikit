<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled and error flow to the field and the adornments; a trailing label that changes width re-pads the field; a long value scrolls under the button.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Input, InputGroup, Textarea } from '@dorsk/tsumikit';

	const labels = ['Send', 'Send (42s)', 'Send ❄️ ~120k'];
	let i = $state(0);
</script>

<div class="list">
	<InputGroup disabled align="center">
		<Input placeholder="Read-only channel" aria-label="Disabled" />
		{#snippet trailing()}<Button variant="primary" size="sm" disabled>Send</Button>{/snippet}
	</InputGroup>
	<InputGroup error align="center">
		<Input value="not an email" aria-label="Invalid invite" />
		{#snippet trailing()}<Button variant="primary" size="sm">Invite</Button>{/snippet}
	</InputGroup>
	<InputGroup>
		<Textarea autoresize rows={1} placeholder="Type past the button to see the bar" aria-label="Width probe" />
		{#snippet trailing()}
			<Button variant="primary" size="sm" onclick={() => (i = (i + 1) % labels.length)}>{labels[i]}</Button>
		{/snippet}
	</InputGroup>
	<InputGroup align="center">
		<Input mono value="https://hooks.example.com/services/T0000/B0000/XXXXXXXXXXXXXXXXXXXXXXXX" aria-label="Webhook" />
		{#snippet trailing()}<Button size="sm">Test</Button>{/snippet}
	</InputGroup>
</div>

<style>
	.list {
		display: grid;
		gap: var(--sp-3);
		max-width: 32rem;
	}
</style>
