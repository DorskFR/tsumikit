<script module>
	export const meta = {
		title: 'States',
		caption: 'placeholder (string or snippet) with no value, disabled, and a long card that truncates inside a narrow trigger.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { RichSelect, Text } from '@dorsk/tsumikit';
	import { PROFILES } from './profiles';

	const long = [
		{
			id: 'long',
			name: 'Overnight migration batch for the analytics warehouse rebuild',
			model: 'claude-opus-5-5',
			machine: 'cyberia-k3s-worker-gpu-02',
		},
		...PROFILES,
	];
	let empty = $state<string | number | undefined>(undefined);
	let snippetEmpty = $state<string | number | undefined>(undefined);
	let disabled = $state<string | number | undefined>('daily');
	let overflow = $state<string | number | undefined>('long');
</script>

{#snippet card({ option }: { option: { name: string; model: string; machine: string } })}
	<span class="card">
		<Text size="sm" weight="medium" truncate>{option.name}</Text>
		<Text size="xs" tone="muted" mono truncate>{option.model} · {option.machine}</Text>
	</span>
{/snippet}

{#snippet pick()}
	<Text size="sm" tone="muted">Pick a profile to spawn with</Text>
{/snippet}

<div class="states">
	<RichSelect label="No profile yet" options={PROFILES} bind:value={empty} getKey={(p) => p.id} getLabel={(p) => p.name} option={card} placeholder="No profile selected" />
	<RichSelect label="Snippet placeholder" options={PROFILES} bind:value={snippetEmpty} getKey={(p) => p.id} getLabel={(p) => p.name} option={card} placeholder={pick} />
	<RichSelect label="Disabled" disabled options={PROFILES} bind:value={disabled} getKey={(p) => p.id} getLabel={(p) => p.name} option={card} />
	<div class="narrow">
		<RichSelect label="Long content" options={long} bind:value={overflow} getKey={(p) => p.id} getLabel={(p) => p.name} option={card} />
	</div>
</div>

<style>
	.states {
		display: grid;
		gap: var(--sp-3);
		max-width: 20rem;
	}
	.narrow {
		max-width: 12rem;
	}
	.card {
		display: grid;
		gap: var(--sp-0-5);
		min-width: 0;
	}
</style>
