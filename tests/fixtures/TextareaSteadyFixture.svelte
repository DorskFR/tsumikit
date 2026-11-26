<script lang="ts">
	import Textarea from '../../src/lib/components/atoms/Textarea.svelte';
	import FileButton from '../../src/lib/components/molecules/FileButton.svelte';
	import InputGroup from '../../src/lib/components/molecules/InputGroup.svelte';

	let {
		grouped = true,
		rows = 1,
		resize = 'top',
		maxHeight
	}: {
		grouped?: boolean;
		rows?: number;
		resize?: 'top' | 'bottom';
		maxHeight?: string;
	} = $props();

	let value = $state('');
</script>

{#snippet attach()}
	<FileButton iconOnly label="Attach" variant="ghost" box="sm" onfiles={() => {}} />
	<FileButton iconOnly label="Attach more" variant="ghost" box="sm" onfiles={() => {}} />
{/snippet}
{#snippet send()}
	<button type="button">Send</button>
{/snippet}

<div id="box">
	{#if grouped}
		<InputGroup leading={attach} trailing={send}>
			<Textarea id="msg" aria-label="Message" autoresize {rows} {resize} {maxHeight} bind:value />
		</InputGroup>
	{:else}
		<Textarea id="msg" aria-label="Message" autoresize {rows} {resize} {maxHeight} block bind:value />
	{/if}
</div>
