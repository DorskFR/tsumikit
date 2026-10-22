<script module>
	export const meta = {
		title: 'Library filter and view',
		caption: 'filter pills with count and bind:value, plus a variant="icon" view toggle on the same row; onchange fires after a selection.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, SegmentedControl, Text } from '@dorsk/tsumikit';
	import { libraryFilters, viewModes } from './data';

	let filter = $state('all');
	let view = $state('grid');
	const count = $derived(libraryFilters.find((f) => f.value === filter)?.count ?? 0);
</script>

<Cluster align="center" justify="space-between">
	<SegmentedControl options={libraryFilters} bind:value={filter} label="Library filter" />
	<SegmentedControl variant="icon" options={viewModes} bind:value={view} label="View mode" />
</Cluster>
<Text size="xs" tone="muted">{count} albums in {view} view</Text>
