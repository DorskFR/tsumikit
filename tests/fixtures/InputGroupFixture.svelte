<script lang="ts">
	import Input from '../../src/lib/components/atoms/Input.svelte';
	import Textarea from '../../src/lib/components/atoms/Textarea.svelte';
	import FileButton from '../../src/lib/components/molecules/FileButton.svelte';
	import InputGroup from '../../src/lib/components/molecules/InputGroup.svelte';
	import type { ControlSize } from '../../src/lib/size';

	let {
		field = 'textarea',
		withLeading = true,
		withTrailing = true,
		sendLabel = 'Send',
		align = 'end',
		size,
		disabled = false,
		error = false,
		resize = 'top',
		attachBox,
		placeholder,
		value = $bindable('')
	}: {
		field?: 'textarea' | 'input';
		withLeading?: boolean;
		withTrailing?: boolean;
		sendLabel?: string;
		align?: 'end' | 'center';
		size?: ControlSize;
		disabled?: boolean;
		error?: boolean;
		resize?: 'none' | 'top' | 'bottom';
		attachBox?: 'xs' | 'sm' | 'md' | 'lg';
		placeholder?: string;
		value?: string;
	} = $props();
</script>

{#snippet attach()}
	{#if attachBox}
		<FileButton iconOnly label="Attach" variant="ghost" box={attachBox} onfiles={() => {}} />
	{:else}
		<button type="button" id="attach">Attach</button>
	{/if}
{/snippet}
{#snippet send()}
	<button type="button" id="send">{sendLabel}</button>
{/snippet}

<button type="button" id="before">before</button>
<InputGroup
	{align}
	{size}
	{disabled}
	{error}
	class="probe"
	style="--probe: 1"
	leading={withLeading ? attach : undefined}
	trailing={withTrailing ? send : undefined}
>
	{#if field === 'textarea'}
		<Textarea
			id="msg"
			aria-label="Message"
			autoresize
			rows={1}
			maxHeight="10rem"
			{resize}
			{placeholder}
			bind:value
		/>
	{:else}
		<Input id="msg" aria-label="Message" />
	{/if}
</InputGroup>
<button type="button" id="after">after</button>
<Textarea id="loose" aria-label="Loose" />
<Input id="loose-input" aria-label="Loose input" />
