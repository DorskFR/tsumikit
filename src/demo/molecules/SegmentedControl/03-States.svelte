<script module>
	export const meta = {
		title: 'States and overflow',
		caption: 'a disabled segment is skipped by arrow keys; no initial value picks the first enabled one; block shares the width; wrap folds rows inside the pill; scroll keeps one row; a pill wider than its box falls back to scrolling.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { SegmentedControl } from '@dorsk/tsumikit';
	import { libraryFilters } from './data';

	let picked = $state<string | undefined>();
	const queue = [
		{ value: 'all', label: 'All', count: 1234 },
		{ value: 'queued', label: 'Queued', count: 3 },
		{ value: 'downloading', label: 'Downloading' },
		{ value: 'failed', label: 'Failed', count: 12 },
		{ value: 'done', label: 'Completed' }
	];
</script>

<SegmentedControl
	bind:value={picked}
	label="Environment"
	options={[
		{ value: 'dev', label: 'Development' },
		{ value: 'staging', label: 'Staging', disabled: true },
		{ value: 'prod', label: 'Production', count: '99+' }
	]}
/>
<SegmentedControl block options={libraryFilters} value="all" label="Block filter" />
<div class="box">
	<SegmentedControl wrap size="sm" options={queue} value="all" label="Wrapped filter" />
</div>
<div class="box">
	<SegmentedControl scroll options={libraryFilters} value="all" label="Scrolling filter" />
</div>
<div class="box">
	<SegmentedControl options={queue} value="all" label="Overflowing filter" />
</div>

<style>
	.box {
		max-width: 16rem;
	}
</style>
