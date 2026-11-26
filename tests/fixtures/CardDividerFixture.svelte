<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
</script>

{#snippet foot()}<span>foot</span>{/snippet}
<Card id="shade" title="Shade" footer={foot}>body</Card>
<Card id="solid" title="Solid" border="solid" footer={foot}>body</Card>
