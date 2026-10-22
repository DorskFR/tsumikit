<script>
	import Disclosure from '$lib/components/molecules/Disclosure.svelte';
	import Accordion from '$lib/components/molecules/Accordion.svelte';
	import DataTable from '$lib/components/organisms/DataTable.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';

	let { silent = false } = $props();
	let open = $state(true);
	const items = [
		{ id: 'a', title: 'A', content: body, open: true },
		{ id: 'b', title: 'B', content: body }
	];
	const rows = [
		{ id: 1, name: 'b' },
		{ id: 2, name: 'a' }
	];
</script>

{#snippet body()}
	<p>body</p>
{/snippet}

<Disclosure bind:open sound={!silent} data-probe="disc">
	{#snippet header()}Head{/snippet}
	<p>panel</p>
</Disclosure>
<Accordion {items} sound={!silent} data-probe="acc" />
<DataTable {rows} rowKey={(r) => r.id} columns={[{ key: 'name', label: 'Name', sortable: true }]} />
<span class="plain"><Icon name="check" data-probe="icon-plain" /></span>
<span class="sized"><Icon name="check" size={24} data-probe="icon-sized" /></span>
