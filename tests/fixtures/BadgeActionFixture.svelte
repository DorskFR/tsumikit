<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';

	let {
		removed = false,
		onremove,
		onaction
	}: { removed?: boolean; onremove?: () => void; onaction?: () => void } = $props();
</script>

<Badge removable {onremove}>legacy</Badge>
<Badge actionIcon="retry" actionLabel="Keep API_KEY" {removed} {onaction}>API_KEY</Badge>
<Badge removable actionIcon="trash" {onremove}>both</Badge>
<Badge>plain</Badge>
