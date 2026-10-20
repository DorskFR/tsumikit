<script lang="ts">
	import Container from '../../src/lib/components/layouts/Container.svelte';

	let { fullWidth = false, inset }: { fullWidth?: boolean; inset?: string } = $props();
</script>

<Container {fullWidth} {inset}><p>content</p></Container>
