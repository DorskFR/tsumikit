<script module>
	export const meta = {
		title: 'Panel padding and strip-only',
		caption: 'panelPadding="none" | "sm" | "md"; without a panel the tablist stands alone as a strip.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Tabs, Text, type TabItem } from '@dorsk/tsumikit';

	const tabs: TabItem[] = [
		{ id: 'all', label: 'All', count: 742 },
		{ id: 'monitored', label: 'Monitored', count: 646 },
		{ id: 'missing', label: 'Missing', count: 120 }
	];
	let none = $state<string | undefined>('all');
	let sm = $state<string | undefined>('all');
	let strip = $state<string | undefined>('monitored');
</script>

<Tabs {tabs} bind:value={none} panelPadding="none" label="No padding">
	{#snippet panel(id)}<Text size="sm" tone="muted">panelPadding="none" · {id}</Text>{/snippet}
</Tabs>
<Tabs {tabs} bind:value={sm} panelPadding="sm" label="Small padding">
	{#snippet panel(id)}<Text size="sm" tone="muted">panelPadding="sm" · {id}</Text>{/snippet}
</Tabs>
<Tabs {tabs} bind:value={strip} label="Strip only" />
<Text size="xs" tone="muted">Strip active: {strip}</Text>
