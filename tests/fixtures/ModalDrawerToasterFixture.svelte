<script lang="ts">
	import Drawer from '$lib/components/molecules/Drawer.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import Toaster from '$lib/components/molecules/Toaster.svelte';

	let {
		modalOpen = $bindable(false),
		drawerOpen = $bindable(false),
		closed = [] as string[],
		toaster = true
	}: { modalOpen?: boolean; drawerOpen?: boolean; closed?: string[]; toaster?: boolean } = $props();
</script>

{#if toaster}<Toaster />{/if}
<Modal title="Modal" bind:open={modalOpen} onclose={() => closed.push('modal')}>
	{#snippet body()}<p data-part="modal-body">modal body</p>{/snippet}
</Modal>
<Drawer title="Drawer" bind:open={drawerOpen} onclose={() => closed.push('drawer')}>
	<p data-part="drawer-body">drawer body</p>
</Drawer>
