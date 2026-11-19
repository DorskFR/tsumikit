<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Cluster from '$lib/components/layouts/Cluster.svelte';
	import FileButton from '$lib/components/molecules/FileButton.svelte';
	import Popover from '$lib/components/molecules/Popover.svelte';
	import SegmentedControl from '$lib/components/molecules/SegmentedControl.svelte';
	import SplitButton from '$lib/components/molecules/SplitButton.svelte';

	type Size = 'sm' | 'md' | 'lg';
	let { size, own }: { size?: Size; own?: Size } = $props();
	const options = [
		{ value: 'a', label: 'A' },
		{ value: 'b', label: 'B' }
	];
	const items = [{ label: 'One', onselect: () => {} }];
</script>

<Cluster {size}>
	<Button control size={own} id="btn">Go</Button>
	<Button control square size={own} id="square" aria-label="Square">S</Button>
	<Button id="plain">Plain</Button>
	<Popover control variant="default" size={own} label="More" id="pop">
		{#snippet trigger()}More{/snippet}
		Panel
	</Popover>
	<FileButton control size={own} label="Upload" />
	<SegmentedControl control size={own} label="Range" value="a" {options} />
	<SplitButton control size={own} {items} menuLabel="More actions">Save</SplitButton>
	<Cluster>
		<Button control id="nested">Nested</Button>
	</Cluster>
	<Cluster size="lg">
		<Button control id="rescoped">Rescoped</Button>
	</Cluster>
</Cluster>
<Button control id="outside">Outside</Button>
