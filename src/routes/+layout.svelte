<script lang="ts">
	import '$lib/styles/app.css';
	// Importing the stores constructs them, which reads localStorage and applies
	// the saved theme / font scale on the client.
	import '$lib/stores/theme.svelte';
	import '$lib/stores/fontscale.svelte';
	import Toaster from '$lib/components/molecules/Toaster.svelte';

	let { children } = $props();
</script>

{@render children()}
<Toaster />
