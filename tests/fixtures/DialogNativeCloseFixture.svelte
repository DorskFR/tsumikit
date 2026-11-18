<script lang="ts">
	import Drawer from '$lib/components/molecules/Drawer.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';

	let {
		controlled = true,
		busy = false,
		modalOpen = $bindable(false),
		drawerOpen = $bindable(false),
		closed = [] as string[]
	}: {
		controlled?: boolean;
		busy?: boolean;
		modalOpen?: boolean;
		drawerOpen?: boolean;
		closed?: string[];
	} = $props();
</script>

{#if controlled}
	<Modal title="Modal" {busy} bind:open={modalOpen} onclose={() => closed.push('modal')}>
		{#snippet body()}<p>modal body</p>{/snippet}
	</Modal>
	<Drawer title="Drawer" bind:open={drawerOpen} onclose={() => closed.push('drawer')}>
		<p>drawer body</p>
	</Drawer>
{:else}
	{#if modalOpen}
		<Modal
			title="Modal"
			{busy}
			onclose={() => {
				closed.push('modal');
				modalOpen = false;
			}}
		>
			{#snippet body()}<p>modal body</p>{/snippet}
		</Modal>
	{/if}
	{#if drawerOpen}
		<Drawer
			title="Drawer"
			onclose={() => {
				closed.push('drawer');
				drawerOpen = false;
			}}
		>
			<p>drawer body</p>
		</Drawer>
	{/if}
{/if}
