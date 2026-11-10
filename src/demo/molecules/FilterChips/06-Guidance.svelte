<script module>
	export const meta = {
		title: 'Which control',
		caption: 'Page views = Tabs, filters = FilterChips, two-state display toggles = SegmentedControl.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, FilterChips, SegmentedControl, Tabs, Text, type SegmentOption, type TabItem } from '@dorsk/tsumikit';
	import { statuses } from './data';

	const views: TabItem[] = [
		{ id: 'albums', label: 'Albums' },
		{ id: 'artists', label: 'Artists' },
		{ id: 'wanted', label: 'Wanted' }
	];
	const layouts: SegmentOption[] = [
		{ value: 'grid', label: 'Grid', icon: 'grid' },
		{ value: 'list', label: 'List', icon: 'list' }
	];
	let view = $state('albums');
	let status = $state('all');
	let layout = $state('grid');
</script>

<Tabs tabs={views} bind:value={view} label="Library views" />
<Cluster align="center" justify="space-between">
	<FilterChips options={statuses} bind:value={status} label="Status" />
	<SegmentedControl variant="icon" size="sm" options={layouts} bind:value={layout} label="Layout" />
</Cluster>
<Text size="xs" tone="muted">{view} · {status} · {layout}</Text>
