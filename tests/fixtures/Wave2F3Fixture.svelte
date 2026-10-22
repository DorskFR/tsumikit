<script lang="ts">
	import Combobox from '$lib/components/molecules/Combobox.svelte';
	import EmojiPicker from '$lib/components/molecules/EmojiPicker.svelte';

	let { which = 'combobox', sound = true, open = false }: { which?: 'combobox' | 'emoji'; sound?: boolean; open?: boolean } = $props();
	// svelte-ignore state_referenced_locally
	let cbOpen = $state(open);
	(globalThis as any).__f3 = { setOpen: (v: boolean) => (cbOpen = v) };
</script>

{#if which === 'combobox'}
	<Combobox options={['a', 'b']} label="Suggestions" bind:open={cbOpen} {sound}>
		<input aria-label="Field" />
	</Combobox>
{:else}
	<EmojiPicker onselect={() => {}} {sound} />
{/if}
