<script module>
	export const meta = {
		title: 'Survives a reload',
		caption: 'href={(id) => tab.href(id)} renders real links (middle-click opens the tab in a new tab); urlState keeps bind:value in the ?tab= param, so a refresh or a shared link lands on the same tab.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Tabs, Text, type TabItem, urlState } from '@dorsk/tsumikit';

	const tabs: TabItem[] = [
		{ id: 'overview', label: 'Overview', icon: 'info' },
		{ id: 'activity', label: 'Activity', icon: 'bell', count: 3 },
		{ id: 'members', label: 'Members', icon: 'users' }
	];
	const tab = urlState('tab', { default: 'overview' });
</script>

<Tabs {tabs} bind:value={tab.value} href={(id) => tab.href(id)} label="Project">
	{#snippet panel(id)}
		<Text size="sm" tone="muted">?tab={id} — reload the page: this tab stays selected.</Text>
	{/snippet}
</Tabs>
