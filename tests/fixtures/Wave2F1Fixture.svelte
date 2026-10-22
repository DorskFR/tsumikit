<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import IconButton from '$lib/components/molecules/IconButton.svelte';
	import OptionButton from '$lib/components/molecules/OptionButton.svelte';
	import FileButton from '$lib/components/molecules/FileButton.svelte';
	import SelectButton from '$lib/components/molecules/SelectButton.svelte';
	import CopyButton from '$lib/components/molecules/CopyButton.svelte';
	import Pagination from '$lib/components/molecules/Pagination.svelte';
	import LoadMore from '$lib/components/molecules/LoadMore.svelte';

	let { sound = true, disabled = false }: { sound?: boolean; disabled?: boolean } = $props();
	let page = $state(2);
	let picked = $state('a');
</script>

<Button id="btn" {sound} {disabled}>Go</Button>
<IconButton id="ib" icon="check" label="Check" {sound} {disabled} />
<OptionButton id="opt" {sound} {disabled}>Option</OptionButton>
<FileButton class="fb" label="Pick" onfiles={() => {}} {sound} {disabled} />
<SelectButton
	class="sb"
	label="Size"
	glyph="A"
	value={picked}
	options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]}
	onchange={(v) => (picked = v)}
	{sound}
/>
<CopyButton class="cp" text="hello" {sound} resetMs={10} />
<Pagination class="pg" bind:page pageCount={5} {sound} />
<LoadMore class="lm" {sound} />
