<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Checkbox from '$lib/components/atoms/Checkbox.svelte';
	import Switch from '$lib/components/atoms/Switch.svelte';
	import IconButton from '$lib/components/molecules/IconButton.svelte';
	import Popover from '$lib/components/molecules/Popover.svelte';
	import Toggle from '$lib/components/molecules/Toggle.svelte';
</script>

<div style="display: flex; flex-direction: column; align-items: flex-start; gap: 48px; padding: 48px">
	<IconButton id="inline" inline label="Dismiss" icon="x" size={14} />
	<IconButton id="inline-danger" inline tone="danger" label="Remove" icon="x" size={14} />
	<Button id="link" variant="link">Dismiss all</Button>
	<Button id="link-primary" variant="link" tone="accent">Send here instead</Button>
	<Button id="ghost" variant="ghost">Re-dispatch</Button>
	<IconButton id="icon" label="Close" icon="x" />
	<Popover bare id="bare" label="More">
		{#snippet trigger()}⋯{/snippet}
		<p>panel</p>
	</Popover>
	<Badge id="badge" size="sm" removable onremove={() => {}}>tag</Badge>
	<Switch id="switch" size="sm" label="Notify" />
	<Checkbox id="checkbox" label="Pin" />
	<Toggle id="toggle">Pinned</Toggle>
</div>
