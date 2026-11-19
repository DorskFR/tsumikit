<script lang="ts">
	import Drawer from '$lib/components/molecules/Drawer.svelte';

	let {
		open = $bindable(false),
		side = 'right'
	}: { open?: boolean; side?: 'left' | 'right' | 'bottom' } = $props();
</script>

<Drawer title="Filters" {side} bind:open>
	<label>Name <input /></label>
</Drawer>
