<script lang="ts">
	import TabBar from '../../src/lib/components/layouts/TabBar.svelte';
	import type { TabBarItem } from '../../src/lib/components/layouts/TabBar.svelte';

	let {
		value = $bindable(),
		links = false,
		placement = 'bar',
		selected = [] as string[]
	}: {
		value?: string;
		links?: boolean;
		placement?: 'bar' | 'inline';
		selected?: string[];
	} = $props();

	const items = $derived<TabBarItem[]>(
		['home', 'activity', 'wanted', 'more'].map((id) => ({
			id,
			label: id.toUpperCase(),
			icon: 'home',
			...(links ? { href: `#${id}` } : { controls: `panel-${id}` }),
			badge: id === 'activity' ? 120 : id === 'wanted' ? 'new' : id === 'more' ? 0 : undefined
		}))
	);
</script>

<TabBar {items} bind:value {placement} onselect={(id) => selected.push(id)} />
<p class="probe-value">{value ?? ''}</p>
