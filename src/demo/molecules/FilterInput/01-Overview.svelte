<script module>
	export const meta = {
		title: 'New session form',
		caption: 'key="cwd" is single-key mode: the box holds the bare path with completion from the provider; display shows a WorkingDir while blurred and inline hosts a machine badge (click to cycle).',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Button, Cluster, Field, FilterInput, WorkingDir } from '@dorsk/tsumikit';
	import { cwdSchema, machines } from './data';

	let cwd = $state('/home/amara/Documents/tsumikit/src/lib/components/molecules');
	let machine = $state(machines[0]);
	const cycle = () => (machine = machines[(machines.indexOf(machine) + 1) % machines.length]);
</script>

<div class="form">
	<Field label="Working directory" hint="Recent folders complete as you type.">
		<FilterInput schema={cwdSchema} key="cwd" bind:value={cwd} icon="folder" placeholder="Pick a folder">
			{#snippet inline()}
				<Badge as="button" tone="info" onclick={cycle}>{machine}</Badge>
			{/snippet}
			{#snippet display({ value })}
				<WorkingDir path={value} />
			{/snippet}
		</FilterInput>
	</Field>
	<Cluster justify="flex-end">
		<Button variant="ghost">Cancel</Button>
		<Button variant="primary" disabled={!cwd}>Start on {machine}</Button>
	</Cluster>
</div>

<style>
	.form {
		display: grid;
		gap: var(--sp-3);
		max-width: 30rem;
	}
</style>
