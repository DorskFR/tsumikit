<script module>
	export const meta = {
		title: 'Audit log',
		caption: 'offset mode: bind:offset with limit and total slices the rows; showRange prints "from–to / total".',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Pagination, Text } from '@dorsk/tsumikit';
	import { AUDIT } from './data';

	const limit = 5;
	let offset = $state(0);
	const rows = $derived(AUDIT.slice(offset, offset + limit));
</script>

<ul class="log">
	{#each rows as row (row.id)}
		<li>
			<Text mono size="xs" tone="muted">{row.at}</Text>
			<Text size="sm"><Text weight="medium">@{row.actor}</Text> {row.action}</Text>
		</li>
	{/each}
</ul>
<Cluster justify="flex-end">
	<Pagination bind:offset {limit} total={AUDIT.length} size="sm" showRange />
</Cluster>

<style>
	.log {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--sp-1);
	}
	li {
		display: flex;
		gap: var(--sp-3);
		align-items: baseline;
	}
</style>
