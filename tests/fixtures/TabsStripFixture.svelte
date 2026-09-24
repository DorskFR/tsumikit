<script lang="ts">
	import Tabs from '../../src/lib/components/molecules/Tabs.svelte';
	import type { TabItem } from '../../src/lib/components/molecules/Tabs.svelte';

	let {
		value = $bindable('b'),
		closable = true,
		withPanel = false,
		pinned = true,
		closed = [] as string[]
	}: { value?: string; closable?: boolean; withPanel?: boolean; pinned?: boolean; closed?: string[] } =
		$props();

	let tabs = $state<TabItem[]>([
		{ id: 'a', label: 'Alpha', title: 'Alpha document' },
		{ id: 'b', label: 'Beta' },
		{ id: 'c', label: 'Gamma', disabled: true },
		{ id: 'd', label: 'Delta' },
		// svelte-ignore state_referenced_locally
		...(pinned ? [{ id: 'pinned', label: 'Pinned', closable: false }] : [])
	]);

	function onclose(id: string) {
		closed.push(id);
		tabs = tabs.filter((t) => t.id !== id);
	}
</script>

{#snippet panel(id: string)}
	<p class="probe-panel">{id}</p>
{/snippet}

<Tabs {tabs} bind:value {closable} {onclose} panel={withPanel ? panel : undefined}>
	{#snippet leading(t)}
		<span class="probe-leading" data-for={t.id}>•</span>
	{/snippet}
	{#snippet actions()}
		<button type="button" class="probe-action">close all</button>
	{/snippet}
</Tabs>
