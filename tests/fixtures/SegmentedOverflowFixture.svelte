<script lang="ts">
	import SegmentedControl, {
		type SegmentOption
	} from '../../src/lib/components/molecules/SegmentedControl.svelte';

	let { wrap = false }: { wrap?: boolean } = $props();

	const libFilters: SegmentOption[] = [
		{ value: 'all', label: 'All', count: 742 },
		{ value: 'monitored', label: 'Monitored', count: 646 },
		{ value: 'missing', label: 'Missing', count: 120 },
		{ value: 'cutoff', label: 'Cutoff unmet', count: 31 }
	];
	const wrapped: SegmentOption[] = [
		{ value: 'a', label: 'All', count: 1234 },
		{ value: 'b', label: 'Queued', count: 3 },
		{ value: 'c', label: 'Downloading' },
		{ value: 'd', label: 'Failed', count: 12 },
		{ value: 'e', label: 'Completed' }
	];
	const viewModes: SegmentOption[] = [
		{ value: 'grid', icon: 'grid' },
		{ value: 'list', icon: 'list' }
	];
	const scopeModes: SegmentOption[] = [
		{ value: 'album', label: 'By album', icon: 'grid' },
		{ value: 'artist', label: 'By artist', icon: 'list' }
	];
</script>

<div class="case" data-case="default">
	<div style="display: flex; gap: 0.75rem; align-items: center">
		<SegmentedControl options={libFilters} value="all" label="Library filter" {wrap} />
		<span>selected: all</span>
	</div>
</div>
<div class="case" data-case="wrap-sm">
	<div style="max-width: 16rem">
		<SegmentedControl wrap size="sm" options={wrapped} value="a" label="Wrapped filter" />
	</div>
</div>
<div class="case" data-case="icon">
	<SegmentedControl variant="icon" options={viewModes} value="grid" label="View mode" />
</div>
<div class="case" data-case="icon-collapse-mobile">
	<SegmentedControl variant="icon" collapseLabels="mobile" options={scopeModes} value="album" label="Scope" />
</div>
<div class="case" data-case="sm">
	<SegmentedControl size="sm" options={libFilters} value="all" label="Library filter compact" />
</div>
<div class="case" data-case="block">
	<SegmentedControl block options={libFilters} value="all" label="Library filter block" />
</div>
<div class="case" data-case="scroll">
	<div style="max-width: 16rem">
		<SegmentedControl scroll options={libFilters} value="all" label="Library filter scroll" />
	</div>
</div>
<div class="case" data-case="collapse-container">
	<div style="container-type: inline-size; width: 20rem">
		<SegmentedControl
			variant="icon"
			collapseLabels="container"
			options={scopeModes}
			value="album"
			label="Scope in container"
		/>
	</div>
</div>
