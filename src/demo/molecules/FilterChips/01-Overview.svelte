<script module>
	export const meta = {
		title: 'Library status filter',
		caption: 'options with count, bind:value and a label naming the group; arrows, Home and End move the selection.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { FilterChips, Text } from '@dorsk/tsumikit';
	import { statuses } from './data';

	let status = $state('all');
	const shown = $derived(statuses.find((s) => s.id === status)?.count ?? 0);
</script>

<FilterChips options={statuses} bind:value={status} label="Status" />
<Text size="xs" tone="muted">{shown.toLocaleString('en-US')} albums shown</Text>
