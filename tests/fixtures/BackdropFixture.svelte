<script lang="ts">
	import Backdrop from '../../src/lib/components/layouts/Backdrop.svelte';

	let {
		src,
		alt = 'Night drive',
		fade = 'bottom',
		withChildren = true,
	}: { src?: string | null; alt?: string; fade?: 'bottom' | 'none'; withChildren?: boolean } = $props();
</script>

<Backdrop {src} {alt} {fade} aria-label="Album header" data-testid="hero">
	{#if withChildren}
		<h1>Night drive</h1>
	{/if}
</Backdrop>
