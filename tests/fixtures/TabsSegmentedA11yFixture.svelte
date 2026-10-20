<script lang="ts">
	import Accordion from '../../src/lib/components/molecules/Accordion.svelte';
	import SegmentedControl from '../../src/lib/components/molecules/SegmentedControl.svelte';
	import Tabs from '../../src/lib/components/molecules/Tabs.svelte';

	let {
		tabValue = $bindable('src/app.ts'),
		segValue = $bindable('v1.2')
	}: { tabValue?: string; segValue?: string } = $props();

	const tabs = [
		{ id: 'src/app.ts', label: 'app.ts' },
		{ id: 'off:limits', label: 'Locked', disabled: true },
		{ id: 'v1.2', label: 'v1.2' },
		{ id: 'a b', label: 'a b' }
	];
	const options = [
		{ value: 'status:open', label: 'Open' },
		{ value: 'v1.2', label: 'v1.2' },
		{ value: 'a/b', label: 'a/b', disabled: true },
		{ value: 'a b', label: 'a b' }
	];
	const items = [
		{ id: 'general', title: 'General', content: body },
		{ id: 'advanced', title: 'Advanced', content: body }
	];
</script>

{#snippet body()}
	<p class="probe-body">body</p>
{/snippet}

{#snippet panel(id: string)}
	<p class="probe-panel">{id}</p>
{/snippet}

<Tabs {tabs} bind:value={tabValue} {panel} />
<SegmentedControl {options} bind:value={segValue} />
<Accordion {items} class="acc-one" />
<Accordion {items} class="acc-two" />
