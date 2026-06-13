<script lang="ts">
	import '$lib/styles/app.css';
	// Importing the stores constructs them, which reads localStorage and applies
	// the saved theme / font scale on the client.
	import '$lib/stores/theme.svelte';
	import '$lib/stores/fontscale.svelte';

	let { children } = $props();
</script>

{@render children()}
