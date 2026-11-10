<script module>
	export const meta = {
		title: 'Filter in the URL',
		caption: 'href={(id) => string} renders each chip as a real link with aria-current; urlState keeps the ?status= param so the filter survives a reload and can be shared.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { FilterChips, Text, urlState } from '@dorsk/tsumikit';
	import { statuses } from './data';

	const status = urlState('status', { default: 'all' });
</script>

<FilterChips options={statuses} bind:value={status.value} href={(id) => status.href(id)} label="Status" />
<Text size="xs" tone="muted">?status={status.value}</Text>
