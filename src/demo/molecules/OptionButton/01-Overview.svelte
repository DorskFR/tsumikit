<script module>
	export const meta = {
		title: 'Effort picker',
		caption: 'selected with onclick; label over hint inside the card; the grid wraps on narrow screens.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { OptionButton, Text } from '@dorsk/tsumikit';
	import { efforts } from './data';

	let effort = $state('medium');
</script>

<div class="grid">
	{#each efforts as o (o.id)}
		<OptionButton selected={effort === o.id} onclick={() => (effort = o.id)}>
			<Text weight="semibold">{o.label}</Text>
			<Text size="xs" tone="muted">{o.hint}</Text>
		</OptionButton>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
		gap: var(--sp-2);
		max-width: 32rem;
	}
</style>
