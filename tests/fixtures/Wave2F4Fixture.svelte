<script lang="ts">
	import Modal from '$lib/components/molecules/Modal.svelte';
	import Drawer from '$lib/components/molecules/Drawer.svelte';
	import Menu from '$lib/components/molecules/Menu.svelte';
	import ConfirmModal from '$lib/components/molecules/ConfirmModal.svelte';
	import Toaster from '$lib/components/molecules/Toaster.svelte';

	let {
		modalOpen = $bindable(false),
		drawerOpen = $bindable(false),
		menuOpen = $bindable(false),
		confirmOpen = $bindable(false),
		sound = true,
		picked = [] as string[]
	}: {
		modalOpen?: boolean;
		drawerOpen?: boolean;
		menuOpen?: boolean;
		confirmOpen?: boolean;
		sound?: boolean;
		picked?: string[];
	} = $props();

	const items = [
		{ label: 'Rename', onselect: () => picked.push('rename') },
		{ label: 'Delete', onselect: () => picked.push('delete'), disabled: true }
	];
</script>

<Toaster {sound} />
<Modal title="Modal" bind:open={modalOpen} {sound}>
	{#snippet body()}<p>modal body</p>{/snippet}
</Modal>
<Drawer title="Drawer" bind:open={drawerOpen} {sound}>
	<p>drawer body</p>
</Drawer>
<ConfirmModal title="Sure?" bind:open={confirmOpen} onconfirm={() => {}} {sound} />
<Menu label="Actions" {items} bind:open={menuOpen} {sound}>
	{#snippet trigger()}⋯{/snippet}
</Menu>
