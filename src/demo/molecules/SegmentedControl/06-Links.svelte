<script module>
	export const meta = {
		title: 'Filter in the URL',
		caption: 'href={(value) => string} renders each segment as a real link with aria-current; urlState keeps the ?filter= param so the filter survives a reload and can be shared.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { SegmentedControl, Text, urlState } from '@dorsk/tsumikit';
	import { libraryFilters } from './data';

	const filter = urlState('filter', { default: 'all' });
</script>

<SegmentedControl options={libraryFilters} bind:value={filter.value} href={(v) => filter.href(v)} label="Library filter" />
<Text size="xs" tone="muted">?filter={filter.value}</Text>
