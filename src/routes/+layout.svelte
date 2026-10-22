<script lang="ts">
	import '$lib/styles/app.css';
	import '$lib/looks/depth.css';
	import '$lib/looks/tactile.css';
	import '$lib/looks/editorial.css';
	// Importing the stores constructs them, which reads localStorage and applies
	// the saved theme / font scale on the client.
	import { THEME_PREPAINT } from '$lib/stores/theme.svelte';
	import '$lib/stores/fontscale.svelte';
	import { FX_PREPAINT } from '$lib/stores/fx.svelte';
	import Toaster from '$lib/components/molecules/Toaster.svelte';
	import { trackPointer } from '$lib/pointer';

	let { children } = $props();

	$effect(() => trackPointer());
</script>

<svelte:head>
	{@html `<script>${THEME_PREPAINT}${FX_PREPAINT}</` + `script>`}
</svelte:head>

{@render children()}
<Toaster />
