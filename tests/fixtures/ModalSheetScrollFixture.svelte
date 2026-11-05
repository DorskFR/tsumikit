<script lang="ts">
	import Modal from '$lib/components/molecules/Modal.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<Modal title="Tall sheet" bind:open>
	{#snippet body()}
		<label>Name <input /></label>
		{#each Array.from({ length: 40 }, (_, i) => i) as i (i)}
			<p>Row {i}</p>
		{/each}
	{/snippet}
	{#snippet footer()}
		<button type="button">Done</button>
	{/snippet}
</Modal>
