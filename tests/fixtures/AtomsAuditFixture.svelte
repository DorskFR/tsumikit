<script lang="ts">
	import Badge from '../../src/lib/components/atoms/Badge.svelte';
	import Button from '../../src/lib/components/atoms/Button.svelte';
	import Card from '../../src/lib/components/atoms/Card.svelte';
	import Scrim from '../../src/lib/components/atoms/Scrim.svelte';

	let {
		onlog = (_: string) => {},
		disabled = false,
		loading = false,
		saving = false,
		under = false,
		over = false,
		inPopover = false,
		modal = false
	}: {
		onlog?: (entry: string) => void;
		disabled?: boolean;
		loading?: boolean;
		saving?: boolean;
		under?: boolean;
		over?: boolean;
		inPopover?: boolean;
		modal?: boolean;
	} = $props();
</script>

<Button id="link" href="/checkout" {disabled} {loading} onclick={() => onlog('link')}>Pay</Button>
<Button id="collapse" collapseLabel="mobile">
	<span data-label>{saving ? 'Saving…' : 'Save'}</span>
</Button>

<form id="form" onsubmit={(e) => { e.preventDefault(); onlog('submit'); }}>
	<Card id="card" as="button" onclick={() => onlog('card')}>pick</Card>
	<Card id="card-submit" as="button" type="submit">go</Card>
	<Card id="card-div">div</Card>
	<Badge id="badge" as="button" onclick={() => onlog('badge')}>toggle</Badge>
	<Badge id="badge-span">span</Badge>
</form>

{#if under}<Scrim onclose={() => onlog('under')} />{/if}
{#if over}<Scrim onclose={() => onlog('over')} />{/if}
{#if inPopover}
	<div id="pop" popover="manual"><Scrim onclose={() => onlog('pop')} /><input id="pop-input" /></div>
{/if}
{#if modal}<dialog id="modal" open><input id="modal-input" /></dialog>{/if}
<input id="outside" />
