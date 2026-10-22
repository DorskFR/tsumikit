<script module>
	export const meta = {
		title: 'Sizes and icons',
		caption: 'size sm, md, lg; variant="icon" for icon-only toggles or icons beside labels.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { SegmentedControl } from '@dorsk/tsumikit';
	import { libraryFilters, scopeModes, viewModes } from './data';

	let filter = $state('monitored');
	let scope = $state('album');
	let view = $state('grid');
</script>

<SegmentedControl size="sm" options={libraryFilters} bind:value={filter} label="Compact filter" />
<SegmentedControl size="md" options={libraryFilters} bind:value={filter} label="Default filter" />
<SegmentedControl size="lg" options={libraryFilters} bind:value={filter} label="Large filter" />
<SegmentedControl variant="icon" options={scopeModes} bind:value={scope} label="Scope" />
<SegmentedControl variant="icon" options={viewModes} bind:value={view} label="View mode" />
