<script lang="ts">
	import RichSelect from '$lib/components/molecules/RichSelect.svelte';
	import { moveItem } from '$lib/components/molecules/sortable-list-order.js';

	type Profile = { id: string; name: string; model: string };

	let { reorderable = true }: { reorderable?: boolean } = $props();

	let profiles = $state<Profile[]>([
		{ id: 'opus', name: 'Opus deep work', model: 'opus' },
		{ id: 'sonnet', name: 'Sonnet daily', model: 'sonnet' },
		{ id: 'haiku', name: 'Haiku quick', model: 'haiku' },
		{ id: 'sol', name: 'Sol review', model: 'sol' },
	]);
	let value = $state<string | number | undefined>('sonnet');
	let changes = $state(0);
	let gear = $state('');
	let moves = $state<string[]>([]);
</script>

<RichSelect
	label="Spawn profile"
	options={profiles}
	bind:value
	getKey={(p) => p.id}
	getLabel={(p) => p.name}
	onchange={() => changes++}
	sound={false}
	onreorder={reorderable
		? (from, to) => {
				moves = [...moves, `${from}>${to}`];
				profiles = moveItem(profiles, from, to);
			}
		: undefined}
>
	{#snippet option({ option, selected, inTrigger })}
		<span class="card" data-selected={selected} data-in-trigger={inTrigger}>{option.name} · {option.model}</span>
	{/snippet}
	{#snippet trailing({ option })}
		<button type="button" class="gear" onclick={() => (gear = option.id)}>Settings for {option.name}</button>
	{/snippet}
	{#snippet footer({ close })}
		<button type="button" id="new" onclick={close}>New profile</button>
	{/snippet}
</RichSelect>
<output id="value">{value}</output>
<output id="changes">{changes}</output>
<output id="gear">{gear}</output>
<output id="moves">{moves.join(',')}</output>
<output id="order">{profiles.map((p) => p.id).join(',')}</output>
