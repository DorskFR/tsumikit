<script lang="ts">
	import SortableList from '../../src/lib/components/molecules/SortableList.svelte';

	type Rare = { id: string; name: string; pinned?: boolean };

	let {
		initial,
		adopt = true,
		canMove,
		pinned = false,
		handle = 'grip',
		revertAfter = 3000,
		onreorder,
		onselect
	}: {
		initial: Rare[];
		adopt?: boolean;
		canMove?: (key: string, to: number) => boolean;
		pinned?: boolean;
		handle?: 'grip' | 'row';
		revertAfter?: number;
		onreorder?: (keys: string[], move: { key: string; from: number; to: number }) => void;
		onselect?: (key: string) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let items = $state(initial.map((r) => ({ ...r })));
	let selected = $state<string | undefined>(undefined);
</script>

<SortableList
	{items}
	key={(r) => r.id}
	name={(r) => r.name}
	label="Rare order"
	numbered
	{handle}
	{canMove}
	{revertAfter}
	locked={pinned ? (r) => !!r.pinned : undefined}
	bind:selected
	{onselect}
	onreorder={(keys, move) => {
		onreorder?.(keys, move);
		if (adopt) items = keys.map((k) => items.find((r) => r.id === k) as Rare);
	}}
>
	{#snippet row(r)}<span class="name">{r.name}</span>{/snippet}
</SortableList>
<button type="button" id="after">after</button>
