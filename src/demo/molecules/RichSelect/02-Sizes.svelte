<script module>
	export const meta = {
		title: 'Sizes',
		caption: 'box="sm" | "md" | "lg" sets the trigger floor; the card decides the rest.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { RichSelect, Text } from '@dorsk/tsumikit';
	import { PROFILES } from './profiles';

	let small = $state<string | number | undefined>('quick');
	let medium = $state<string | number | undefined>('daily');
	let large = $state<string | number | undefined>('deep');
</script>

{#snippet card({ option }: { option: (typeof PROFILES)[number] })}
	<Text size="sm" truncate>{option.name}</Text>
{/snippet}

<div class="sizes">
	<RichSelect label="Small" box="sm" options={PROFILES} bind:value={small} getKey={(p) => p.id} getLabel={(p) => p.name} option={card} />
	<RichSelect label="Medium" box="md" options={PROFILES} bind:value={medium} getKey={(p) => p.id} getLabel={(p) => p.name} option={card} />
	<RichSelect label="Large" box="lg" options={PROFILES} bind:value={large} getKey={(p) => p.id} getLabel={(p) => p.name} option={card} />
</div>

<style>
	.sizes {
		display: grid;
		gap: var(--sp-3);
		max-width: 16rem;
	}
</style>
