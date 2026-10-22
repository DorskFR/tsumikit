<script module>
	export const meta = {
		title: 'Spawn profile rows',
		caption: 'variant="rows" with note, description, an action snippet outside the label and a below panel the consumer owns.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { IconButton, RadioGroup, Text } from '@dorsk/tsumikit';
	import { profiles } from './data';

	let value = $state('personal');
	let open = $state<string | null>(null);
</script>

<div class="picker">
	<RadioGroup label="Spawn profile" variant="rows" options={profiles} bind:value>
		{#snippet action(o)}
			<IconButton
				icon="settings"
				inline
				label="Configure {o.label}"
				pressed={open === o.value}
				onclick={() => (open = open === o.value ? null : o.value)}
			/>
		{/snippet}
		{#snippet below(o)}
			{#if open === o.value}
				<Text size="xs" tone="muted">Model, effort and permission mode for {o.label} go here.</Text>
			{/if}
		{/snippet}
	</RadioGroup>
	<Text size="xs" tone="muted">Next session spawns with the {value} profile.</Text>
</div>

<style>
	.picker {
		display: grid;
		gap: var(--sp-2);
		max-width: 26rem;
	}
</style>
