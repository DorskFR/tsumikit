<script lang="ts">
	import Pagination from '../../src/lib/components/molecules/Pagination.svelte';
	import SegmentedControl from '../../src/lib/components/molecules/SegmentedControl.svelte';
	import Tabs from '../../src/lib/components/molecules/Tabs.svelte';

	let {
		tabValue = $bindable('overview'),
		segValue = $bindable('all'),
		page = $bindable(2)
	}: { tabValue?: string; segValue?: string; page?: number } = $props();

	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'logs', label: 'Logs' },
		{ id: 'locked', label: 'Locked', disabled: true },
		{ id: 'docs', label: 'Docs', href: '/docs' }
	];
	const options = [
		{ value: 'all', label: 'All' },
		{ value: 'open', label: 'Open' },
		{ value: 'off', label: 'Off', disabled: true }
	];
</script>

{#snippet panel(id: string)}
	<p class="probe-panel">{id}</p>
{/snippet}

<Tabs {tabs} bind:value={tabValue} href={(id) => `?tab=${id}`} {panel} />
<SegmentedControl {options} bind:value={segValue} href={(v) => `?filter=${v}`} />
<Pagination bind:page pageCount={5} href={(p) => `?page=${p}`} />
