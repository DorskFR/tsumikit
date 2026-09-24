<script lang="ts">
	import Menu from '../../src/lib/components/molecules/Menu.svelte';

	let open = $state(false);
	const items = [
		{ label: 'First', onselect: () => {} },
		{ label: 'Second', onselect: () => {} }
	];
</script>

<button type="button" id="opener" onclick={() => (open = true)}>open</button>
<button type="button" id="closer" onclick={() => (open = false)}>close</button>
<output id="state">{open}</output>
<Menu label="Actions" {items} bind:open>
	{#snippet trigger()}⋯{/snippet}
</Menu>
