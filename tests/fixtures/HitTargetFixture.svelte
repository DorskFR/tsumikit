<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Checkbox from '$lib/components/atoms/Checkbox.svelte';
	import Switch from '$lib/components/atoms/Switch.svelte';
	import IconButton from '$lib/components/molecules/IconButton.svelte';
	import Popover from '$lib/components/molecules/Popover.svelte';
</script>

<div style="display: flex; flex-direction: column; align-items: flex-start; gap: 48px; padding: 48px">
	<IconButton id="inline" inline label="Close" icon="x" size={14} />
	<Button id="link" variant="link">Details</Button>
	<Popover bare id="bare">
		{#snippet trigger()}⋯{/snippet}
		<p>panel</p>
	</Popover>
	<Badge id="badge" size="sm" removable onremove={() => {}}>tag</Badge>
	<Switch id="switch" size="sm" label="Notify" />
	<Checkbox id="checkbox" />
</div>
