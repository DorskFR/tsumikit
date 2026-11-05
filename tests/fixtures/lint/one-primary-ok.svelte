<script>
	import { Button } from '@dorsk/tsumikit';
	let { ok } = $props();
</script>

{#if ok}
	<Button variant="primary">Save</Button>
{:else if !ok}
	<Button variant="primary">Retry</Button>
{:else}
	<Button variant="primary">Start</Button>
{/if}
{#snippet footer()}
	<Button variant="primary">Confirm</Button>
{/snippet}
