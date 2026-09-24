<script lang="ts">
	import Button from '../../src/lib/components/atoms/Button.svelte';
	import IconButton from '../../src/lib/components/molecules/IconButton.svelte';
	import Popover from '../../src/lib/components/molecules/Popover.svelte';

	let { count, countMax }: { count?: number; countMax?: number } = $props();
</script>

<Button id="text" {count} {countMax}>Inbox</Button>
<Button id="labelled" aria-label="Inbox" {count} {countMax}>I</Button>
<Button id="collapsed" collapseLabel="mobile" {count} {countMax}><span data-label>Inbox</span></Button>
<IconButton id="icon" icon="bell" label="Notifications" {count} {countMax} />
<Popover id="pop" label="Filters" {count} {countMax}>
	{#snippet trigger()}F{/snippet}
	panel
</Popover>
