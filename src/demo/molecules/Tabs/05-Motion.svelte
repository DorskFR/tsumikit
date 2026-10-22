<script module>
	export const meta = {
		title: 'Micro-interactions',
		caption: 'data-fx-tabs on any ancestor: "pill" (default) slides a raised pill, "stretch" stretches the line across, "ink" spreads from the click point, "none" keeps the plain line.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Stack, Tabs, Text, type TabItem } from '@dorsk/tsumikit';

	const tabs: TabItem[] = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'activity', label: 'Activity', count: 3 },
		{ id: 'settings', label: 'Settings' }
	];
	const variants = ['pill', 'stretch', 'ink', 'none'] as const;
</script>

{#each variants as v (v)}
	<div data-fx-tabs={v}>
		<Stack gap="var(--sp-1)">
			<Text size="sm" tone="muted" mono>data-fx-tabs="{v}"</Text>
			<Tabs {tabs} label="{v} tabs" />
		</Stack>
	</div>
{/each}
