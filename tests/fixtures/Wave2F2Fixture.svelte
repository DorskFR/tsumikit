<script>
	import Checkbox from '$lib/components/atoms/Checkbox.svelte';
	import Switch from '$lib/components/atoms/Switch.svelte';
	import Toggle from '$lib/components/molecules/Toggle.svelte';
	import RadioGroup from '$lib/components/molecules/RadioGroup.svelte';
	import SegmentedControl from '$lib/components/molecules/SegmentedControl.svelte';
	import Tabs from '$lib/components/molecules/Tabs.svelte';
	import TabBar from '$lib/components/layouts/TabBar.svelte';

	let { silent = false } = $props();
	let checked = $state(true);
	let on = $state(true);
	let pressed = $state(false);
	let radio = $state('a');
	let seg = $state('a');
	let tab = $state('a');
	let bar = $state('a');
	const opts = [
		{ value: 'a', label: 'A' },
		{ value: 'b', label: 'B' }
	];
</script>

<Checkbox label="cb" bind:checked sound={!silent} data-probe="cb" />
<Switch label="sw" bind:checked={on} sound={!silent} data-probe="sw" />
<Toggle {pressed} onclick={() => (pressed = !pressed)} sound={!silent} data-probe="tg">T</Toggle>
<RadioGroup label="rg" options={opts} bind:value={radio} sound={!silent} />
<SegmentedControl label="sg" options={opts} bind:value={seg} sound={!silent} />
<Tabs tabs={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]} bind:value={tab} sound={!silent} />
<TabBar items={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]} bind:value={bar} placement="inline" sound={!silent} />
