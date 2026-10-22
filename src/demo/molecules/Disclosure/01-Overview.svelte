<script module>
	export const meta = {
		title: 'Advanced deploy options',
		caption: 'header snippet with the live open flag, bind:open, and a panel that holds real form rows.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Button, Cluster, Disclosure, Switch, Text } from '@dorsk/tsumikit';

	let open = $state(false);
	let canary = $state(true);
	let drain = $state(false);
</script>

<div class="form">
	<Text size="sm">Deploy <Text mono>worker-02</Text> to <Text mono>eu-west-1</Text>.</Text>
	<Disclosure bind:open>
		{#snippet header({ open })}
			<span>Advanced options</span>
			<Badge size="xs" tone={open ? 'info' : 'neutral'}>{open ? 'editing' : '2 changed'}</Badge>
		{/snippet}
		<div class="rows">
			<Switch bind:checked={canary} label="Canary 10% for 15 minutes" labelVisible />
			<Switch bind:checked={drain} label="Drain connections before restart" labelVisible />
		</div>
	</Disclosure>
	<Cluster justify="flex-end">
		<Button variant="ghost">Cancel</Button>
		<Button variant="primary">Deploy</Button>
	</Cluster>
</div>

<style>
	.form {
		display: grid;
		gap: var(--sp-3);
		max-width: 32rem;
	}
	.rows {
		display: grid;
		gap: var(--sp-2);
	}
</style>
