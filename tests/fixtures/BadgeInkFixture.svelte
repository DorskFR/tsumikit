<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';

	const colors = ['hsl(160 60% 30%)', 'hsl(60 90% 70%)', 'hsl(200 80% 80%)', 'hsl(0 70% 40%)', '#767676', '#808080', '#111111', '#eeeeee'];
</script>

{#each colors as color, i (color)}
	<Badge id="solid-{i}" {color} variant="solid"><b>ink</b></Badge>
	<Badge id="active-{i}" {color} active><b>ink</b></Badge>
	<Badge id="hover-{i}" {color} variant="solid" as="button"><b>ink</b></Badge>
{/each}
