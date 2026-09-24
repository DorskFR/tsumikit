<script lang="ts">
	import { untrack } from 'svelte';
	import Combobox from '../../src/lib/components/molecules/Combobox.svelte';

	let {
		kind = 'input',
		options: initialOptions = ['apple', 'apricot', 'banana'],
		open: initialOpen = true,
		homeEnd = false,
		empty = undefined,
		fieldRole = 'auto',
		onselect,
		onclose
	}: {
		kind?: 'input' | 'textarea';
		options?: string[];
		open?: boolean;
		homeEnd?: boolean;
		empty?: string;
		fieldRole?: 'auto' | 'combobox' | 'none';
		onselect?: (option: string, index: number) => void;
		onclose?: (reason: 'escape' | 'blur' | 'select') => void;
	} = $props();

	let options = $state(untrack(() => initialOptions));
	let open = $state(untrack(() => initialOpen));
	let index = $state(0);
	let value = $state('');

	(globalThis as Record<string, unknown>).__cbctl = {
		setOpen: (v: boolean) => (open = v),
		setOptions: (o: string[]) => (options = o),
		state: () => ({ open, index })
	};
</script>

<Combobox {options} bind:open bind:index label="Suggestions" {homeEnd} {empty} {fieldRole} {onselect} {onclose}>
	{#if kind === 'textarea'}
		<textarea aria-label="Message" bind:value></textarea>
	{:else}
		<input aria-label="Fruit" bind:value />
	{/if}
</Combobox>
<button type="button" id="after">after</button>
