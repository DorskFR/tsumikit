<script>
	import { Button } from '@dorsk/tsumikit';
	let { items, ok } = $props();
</script>

<Button variant="primary">Save</Button>
<Button variant="ghost">Cancel</Button>
{#if ok}
	<Button variant="primary">Also</Button>
{:else}
	<Button variant="primary">Alt</Button>
{/if}
<Button variant={ok ? 'primary' : 'ghost'}>dynamic</Button>

{#snippet footer()}
	<Button variant="primary">One</Button>
	<Button variant="primary">Two</Button>
{/snippet}
